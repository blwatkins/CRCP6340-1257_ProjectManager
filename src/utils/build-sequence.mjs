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

import { Hash } from './hash.mjs';
import { Project } from './project.mjs';
import { SeedString } from './seed-string.mjs';

export class BuildSequence {
    #BUILD_ANIMATION_FILES_PATH = 'build-steps/02-animation-files';
    #THUMBNAIL_IMAGES_PATH = 'build-steps/03-thumbnail-images';

    #project;

    constructor() {
        this.#project = new Project();
    }

    async completeBuildSequence() {
        this.#buildAnimationFiles();
        await this.#captureThumbnailImages();
    }

    #isTruthyString(input) {
        return input && typeof input === 'string' && input.trim().length > 0;
    }

    #buildPath(path, filename) {
        if (!this.#isTruthyString(filename) || !this.#isTruthyString(path)) {
            throw new Error('Invalid path or filename');
        }

        return `${path}/${filename}`;
    }

    #buildAnimationFiles() {
        console.log('-- Building animation files...');

        for (let i = 0; i < this.#project.NUMBER_OF_EDITIONS; i++) {
            const tokenSeedString = SeedString.generateSeedString();
            const tokenHash = Hash.getStringHash(tokenSeedString);
            const tokenId = i + 1;
            const tokenHTML = this.#project.getProjectHTML(tokenHash, tokenId);
            const animationFilePath = this.#buildPath(this.#BUILD_ANIMATION_FILES_PATH, `${tokenId}.html`);
            fs.writeFileSync(animationFilePath, tokenHTML);
            console.log(`---- HTML ${animationFilePath} saved successfully.`);
        }
    }

    async #captureThumbnailImages() {
        console.log('-- Capturing thumbnail images...');
        const promises = [];

        for (let i = 0; i < this.#project.NUMBER_OF_EDITIONS; i++) {
            let tokenId = i + 1;
            const animationFilePath = this.#buildPath(this.#BUILD_ANIMATION_FILES_PATH, `${tokenId}.html`);
            const thumbnailFilePath = this.#buildPath(this.#THUMBNAIL_IMAGES_PATH, `${tokenId}.png`);
            const animationHTML = fs.readFileSync(animationFilePath, { encoding: 'utf8', flag: 'r' });

            promises.push(
                this.#saveThumbnail(animationHTML, thumbnailFilePath)
                    .then(() => console.log(`---- Thumbnail ${thumbnailFilePath} captured successfully.`))
            );
        }

        await Promise.all(promises);
    }

    async #saveThumbnail(animationHTML, thumbnailFilePath) {
        await nodeHtmlToImage({
            output: thumbnailFilePath,
            html: animationHTML,
            puppeteerArgs: { defaultViewport: { width: 1080, height: 1080 } }
        });
    }
}
