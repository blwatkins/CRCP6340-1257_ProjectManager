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

import jsdom from 'jsdom';
import fs from 'fs';

import { DEFAULT_SEED_STRING } from './constants.mjs';
import { Hash } from './hash.mjs';

const { JSDOM } = jsdom;

const DEFAULT_HASH = Hash.getStringHash(DEFAULT_SEED_STRING);

export class ProjectPreview {
    #projectData = {};

    constructor() {
        this.#projectData = JSON.parse(fs.readFileSync('build-steps/01-project-bundle/project-data.json', { encoding: 'utf8', flag: 'r' }));
    }

    getTokenData(tokenHash = DEFAULT_HASH, tokenID = -1) {
        return {
            tokenHash: tokenHash,
            tokenID: tokenID,
            projectName: this.#projectData.name,
            artistName: this.#projectData.artist,
            properties: { placeholder: 'property placeholder' },
            toData: { placeholder: 'toData placeholder' }
        };
    }

    getHashSeededRandom(minimize = false) {
        let content = '';

        try {
            const fileContents = fs.readFileSync('build-steps/01-project-bundle/hash-seeded-random.js', { encoding: 'utf8', flag: 'r' });
            content = fileContents;

            if (minimize) {
                content = fileContents.split('\n').map(line => line.trim()).join(' ');
            }
        } catch (error) {
            console.error('Error reading file:', error);
        }

        return content;
    }

    getIFrameString(tokenHash = DEFAULT_HASH) {
        const DOM = new JSDOM();
        const document = DOM.window.document;
        document.head.title = 'TEST IFRAME TITLE';
        document.body.innerHTML = '<h1>TEST IFRAME</h1>';

        const tokenDataScript = document.createElement('script');
        tokenDataScript.id = 'token-data';
        tokenDataScript.text = `const TOKEN_DATA = ${JSON.stringify(this.getTokenData(tokenHash))};`;
        document.body.appendChild(tokenDataScript);

        const hashSeededRandomScript = document.createElement('script');
        hashSeededRandomScript.id = 'hash-seeded-random';
        hashSeededRandomScript.text = this.getHashSeededRandom(true);
        document.body.appendChild(hashSeededRandomScript);

        return DOM.serialize();
    }
}
