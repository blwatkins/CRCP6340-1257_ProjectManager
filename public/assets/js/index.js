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

'use strict';

(() => {
    const SEED_STRING_ID = 'current-seed-string';
    const KEEP_SEED_STRING_ID = 'keep-seed-string';
    const NEW_SEED_STRING_ID = 'new-seed-string';
    const PROJECT_PREVIEW_FRAME_ID = 'project-preview-frame';

    function updateIFrameSource(seedString) {
        let frameSource = '/iframe';

        if (seedString && typeof seedString === 'string' && seedString.trim().length > 0) {
            const urlParams = new URLSearchParams();
            urlParams.set('seedString', seedString);

            frameSource += `?${urlParams.toString()}`;
        }

        const iframe = document.getElementById(PROJECT_PREVIEW_FRAME_ID);

        if (iframe) {
            iframe.src = frameSource;
        }
    }

    function newSeedString() {
        const seedString = generateSeedString();
        const seedStringElement = document.getElementById(SEED_STRING_ID);

        if (seedStringElement) {
            seedStringElement.innerText = seedString;
            updateIFrameSource(seedString);
        }
    }

    function generateSeedString() {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let seedString = '';

        for (let i = 0; i < 20; i++) {
            seedString += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
        }

        return seedString;
    }

    function refreshSeedString() {
        const seedStringElement = document.getElementById(SEED_STRING_ID);

        if (seedStringElement) {
            const seedString = seedStringElement.innerText;
            updateIFrameSource(seedString);
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        const keepSeedStringButton = document.getElementById(KEEP_SEED_STRING_ID);
        const newSeedStringButton = document.getElementById(NEW_SEED_STRING_ID);

        if (keepSeedStringButton) {
            keepSeedStringButton.addEventListener('click', () => {
                refreshSeedString();
            });

            keepSeedStringButton.disabled = false;
        }

        if (newSeedStringButton) {
            newSeedStringButton.addEventListener('click', () => {
                newSeedString();
            });

            newSeedStringButton.disabled = false;
        }
    });
})();
