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

import express from 'express';

import { BuildSequence } from './utils/build-sequence.mjs';
import { DEFAULT_SEED_STRING } from './utils/constants.mjs';
import { Hash } from './utils/hash.mjs';
import { Project } from './utils/project.mjs';

const APP = express();
const PORT = Number.parseInt(process.env.PORT) || 3000;

APP.use(express.static('public'));

APP.get('/iframe', (request, response) => {
    let seedString = request.query.seedString || DEFAULT_SEED_STRING;
    let hash = Hash.getStringHash(seedString);
    const preview = new Project();
    const iframeString = preview.getProjectHTML(hash);
    response.send(iframeString);
});

APP.post('/build-sequence', (request, response) => {
    console.log('Build sequence initiated.');
    const build = new BuildSequence();

    try {
        build.completeBuildSequence();
        console.log('Build sequence complete!');
        response.send({ result: 'Build sequence complete!' });
    } catch (error) {
        console.error('Error during build sequence:', error);
        response.status(500).send({ result: 'Build sequence error.' });
    }
});

APP.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
});
