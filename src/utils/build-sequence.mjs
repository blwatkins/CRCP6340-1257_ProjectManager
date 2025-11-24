/*
 * Copyright (C) 2025 brittni watkins.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import fs from 'fs';
import nodeHtmlToImage from 'node-html-to-image';

import { PromisePool } from '@supercharge/promise-pool';

import { PinataSDK } from 'pinata';

import { Hash } from './hash.mjs';
import { Project } from './project.mjs';
import { SeedString } from './seed-string.mjs';
import { isTruthyString } from './utils.mjs';

export class BuildSequence {
    #BUILD_ANIMATION_FILES_PATH = 'build-steps/02-animation-files';
    #THUMBNAIL_IMAGES_PATH = 'build-steps/03-thumbnail-images';
    #IPFS_DATA = {};

    #PINATA;
    #PROJECT;

    constructor() {
        this.#PROJECT = new Project();

        this.#PINATA = new PinataSDK({
            pinataGateway: process.env.PINATA_GATEWAY,
            pinataJwt: process.env.PINATA_JWT
        });
    }

    /**
     * Executes the full build sequence for the project.
     *
     * This method performs the following steps:
     *   1. Generates and saves animation HTML files for each edition.
     *   2. Captures thumbnail images from the generated HTML files.
     *   3. Pins the generated files to IPFS via the Pinata API.
     *
     * Side effects:
     *   - Creates HTML files in the build-steps/02-animation-files directory.
     *   - Creates PNG thumbnail images in the build-steps/03-thumbnail-images directory.
     *   - Makes network/API calls to Pinata for IPFS pinning.
     *
     * Errors:
     *   - Throws if file system operations fail (e.g., permission issues, disk full).
     *   - Throws if network/API calls to Pinata fail.
     *   - Throws if required environment variables (PINATA_GATEWAY, PINATA_JWT) are missing.
     *
     * This method is asynchronous and should be awaited.
     *
     * @returns {Promise<void>}
     */
    async completeBuildSequence() {
        await this.#saveAnimationFiles();
        await this.#captureThumbnailImages();
        await this.#pinFiles();
    }

    #buildPath(path, filename) {
        if (!isTruthyString(filename) || !isTruthyString(path)) {
            throw new Error('Invalid path or filename');
        }

        return `${path}/${filename}`;
    }

    async #saveAnimationFiles() {
        console.log('-- Building animation files...');
        const data = [];

        for (let i = 0; i < this.#PROJECT.NUMBER_OF_EDITIONS; i++) {
            const tokenSeedString = SeedString.generateSeedString();
            const tokenHash = Hash.getStringHash(tokenSeedString);
            const tokenId = i + 1;
            data.push({ tokenHash: tokenHash, tokenId: tokenId });
        }

        await PromisePool.for(data)
            .process(async (data) => {
                await this.#PROJECT.getProjectHTML(data.tokenHash, data.tokenId)
                    .then((tokenHTML) => {
                        const animationFilePath = this.#buildPath(this.#BUILD_ANIMATION_FILES_PATH, `${data.tokenId}.html`);
                        fs.writeFileSync(animationFilePath, tokenHTML, { encoding: 'utf8', flag: 'w' });
                        console.log(`---- HTML ${animationFilePath} saved successfully.`);
                    });
            });
    }

    async #captureThumbnailImages() {
        console.log('-- Capturing thumbnail images...');
        const data = [];

        for (let i = 0; i < this.#PROJECT.NUMBER_OF_EDITIONS; i++) {
            const tokenId = i + 1;
            const animationFilePath = this.#buildPath(this.#BUILD_ANIMATION_FILES_PATH, `${tokenId}.html`);
            const thumbnailFilePath = this.#buildPath(this.#THUMBNAIL_IMAGES_PATH, `${tokenId}.png`);
            const animationHTML = fs.readFileSync(animationFilePath, { encoding: 'utf8', flag: 'r' });
            data.push({ animationHTML: animationHTML, thumbnailFilePath: thumbnailFilePath });
        }

        await PromisePool.for(data)
            .process(async (data) => {
                await this.#saveThumbnail(data.animationHTML, data.thumbnailFilePath)
                    .then(() => console.log(`---- Thumbnail ${data.thumbnailFilePath} captured successfully.`));
            });
    }

    async #saveThumbnail(animationHTML, thumbnailFilePath) {
        await nodeHtmlToImage({
            output: thumbnailFilePath,
            html: animationHTML,
            puppeteerArgs: { defaultViewport: { width: 720, height: 720 } }
        });
    }

    async #pinFiles() {
        console.log('-- Pinning animation files and thumbnail images...');
        const data = {};

        if (!this.#PINATA) {
            throw new Error('Pinata SDK not initialized');
        }

        for (let i = 0; i < this.#PROJECT.NUMBER_OF_EDITIONS; i++) {
            const tokenId = i + 1;
            const animationFilePath = this.#buildPath(this.#BUILD_ANIMATION_FILES_PATH, `${tokenId}.html`);
            const thumbnailFilePath = this.#buildPath(this.#THUMBNAIL_IMAGES_PATH, `${tokenId}.png`);
            const html = fs.readFileSync(animationFilePath, { encoding: 'utf8', flag: 'r' });
            const thumbnailBlob = new Blob([fs.readFileSync(thumbnailFilePath, { flag: 'r' })], { type: 'image/png' });
            this.#IPFS_DATA[tokenId] = {};
            data[tokenId] = { html: html, thumbnailBlob: thumbnailBlob };
        }

        await PromisePool.for(Object.keys(data))
            .process(async (key) => {
                const tokenId = key;
                const tokenData = data[tokenId];
                const html = tokenData.html;
                const thumbnailBlob = tokenData.thumbnailBlob;

                await this.#pinHTMLFile(html, `${tokenId}.html`)
                    .then((upload) => {
                        this.#IPFS_DATA[tokenId].animationHash = upload.cid;
                        console.log(`---- File ${tokenId}.html pinned successfully.`);
                        console.log(`------ IPFS Hash: ${upload.cid}`);
                        console.log(`------ Gateway URL: https://${process.env.PINATA_GATEWAY}/ipfs/${upload.cid}`);
                        console.log(`------ IPFS URL: https://ipfs.io/ipfs/${upload.cid}`);
                    });

                await this.#pinImageFile(thumbnailBlob, `${tokenId}.png`)
                    .then((upload) => {
                        this.#IPFS_DATA[tokenId].thumbnailHash = upload.cid;
                        console.log(`---- File ${tokenId}.png pinned successfully.`);
                        console.log(`------ IPFS Hash: ${upload.cid}`);
                        console.log(`------ Gateway URL: https://${process.env.PINATA_GATEWAY}/ipfs/${upload.cid}`);
                        console.log(`------ IPFS URL: https://ipfs.io/ipfs/${upload.cid}`);
                    });
            });
    }

    #pinHTMLFile(html, filename) {
        const groupId = process.env.PINATA_GROUP_ID;

        if (!groupId) {
            throw new Error('Missing required environment variable: PINATA_GROUP_ID');
        }

        const file = new File([html], filename, { type: 'text/html' });
        return this.#PINATA.upload.public.file(file).group(groupId);
    }

    #pinImageFile(blob, filename) {
        const groupId = process.env.PINATA_GROUP_ID;

        if (!groupId) {
            throw new Error('Missing required environment variable: PINATA_GROUP_ID');
        }

        const file = new File([blob], filename, { type: 'image/png' });
        return this.#PINATA.upload.public.file(file).group(groupId);
    }
}
