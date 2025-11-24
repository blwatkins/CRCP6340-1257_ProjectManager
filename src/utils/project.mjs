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
import jsdom from 'jsdom';

import { minify as cssMinify } from 'csso';
import { minify } from 'terser';

import { DEFAULT_SEED_STRING } from './constants.mjs';
import { Hash } from './hash.mjs';
import { isTruthyString } from './utils.mjs';

const { JSDOM } = jsdom;

const DEFAULT_HASH = Hash.getStringHash(DEFAULT_SEED_STRING);

export class Project {
    #PROJECT_BUNDLE_DIR = 'build-steps/01-project-bundle';
    #PROJECT_DATA_FILENAME = 'project-data.json';
    #PROJECT_STYLESHEET_FILENAME = 'style.css';
    #HASH_SEEDED_RANDOM_FILENAME = 'hash-seeded-random.js';
    #PROJECT_BUNDLE_FILENAME = 'main.js';

    #projectData = {};

    constructor() {
        this.#loadProjectData();
    }

    get NUMBER_OF_EDITIONS() {
        // TODO - read from project metadata
        return 10;
    }

    /**
     * Generates the complete HTML for the project, including metadata, styles, and scripts.
     *
     * @param {string} tokenHash - The hash string representing the token's unique seed. Defaults to DEFAULT_HASH.
     * @param {number} tokenId - The numeric identifier for the token edition. Defaults to -1.
     * @returns {string} A serialized HTML string containing the project title, stylesheet, token data, hash-seeded random script, and project bundle script.
     */
    async getProjectHTML(tokenHash = DEFAULT_HASH, tokenId = -1) {
        const DOM = new JSDOM();
        const document = DOM.window.document;

        const title = document.createElement('title');
        title.textContent = this.#projectData.name;
        document.head.appendChild(title);

        const style = document.createElement('style');
        style.textContent = this.#getProjectStylesheet(true);
        document.head.appendChild(style);

        const tokenDataScript = document.createElement('script');
        tokenDataScript.id = 'token-data';
        tokenDataScript.text = `const TOKEN_DATA = ${JSON.stringify(this.#getTokenData(tokenHash, tokenId))};`;
        document.body.appendChild(tokenDataScript);

        const hashSeededRandomScript = document.createElement('script');
        hashSeededRandomScript.id = 'hash-seeded-random';
        hashSeededRandomScript.text = await this.#getHashSeededRandomScript(true);
        document.body.appendChild(hashSeededRandomScript);

        const projectBundleScript = document.createElement('script');
        projectBundleScript.id = 'project-bundle';
        projectBundleScript.text = this.#getProjectBundle();
        document.body.appendChild(projectBundleScript);

        return DOM.serialize();
    }

    #buildPath(filename) {
        if (!isTruthyString(filename) || !isTruthyString(this.#PROJECT_BUNDLE_DIR)) {
            throw new Error('Invalid project bundle directory or filename');
        }

        return `${this.#PROJECT_BUNDLE_DIR}/${filename}`;
    }

    #loadProjectData() {
        this.#projectData = JSON.parse(
            fs.readFileSync(
                this.#buildPath(this.#PROJECT_DATA_FILENAME),
                { encoding: 'utf8', flag: 'r' }
            )
        );
    }

    #getProjectStylesheet(minimize = false) {
        let content;
        const fileContents = fs.readFileSync(this.#buildPath(this.#PROJECT_STYLESHEET_FILENAME), { encoding: 'utf8', flag: 'r' });

        if (minimize) {
            const minified = cssMinify(fileContents);
            content = minified.css;
        } else {
            content = fileContents;
        }

        return content;
    }

    #getTokenData(tokenHash = DEFAULT_HASH, tokenID = -1) {
        return {
            tokenHash: tokenHash,
            tokenID: tokenID,
            projectName: this.#projectData.name,
            artistName: this.#projectData.artist,
            properties: { placeholder: 'property placeholder' },
            toData: { placeholder: 'toData placeholder' }
        };
    }

    async #getHashSeededRandomScript(minimize = false) {
        let content;
        const fileContents = fs.readFileSync(this.#buildPath(this.#HASH_SEEDED_RANDOM_FILENAME), { encoding: 'utf8', flag: 'r' });

        if (minimize) {
            const minified = await minify(fileContents);
            content = minified.code;
        } else {
            content = fileContents;
        }

        return content;
    }

    #getProjectBundle() {
        return fs.readFileSync(this.#buildPath(this.#PROJECT_BUNDLE_FILENAME), { encoding: 'utf8', flag: 'r' });
    }
}
