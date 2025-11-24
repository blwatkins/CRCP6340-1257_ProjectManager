class HashSeededRandom {
    constructor(hash) {
        this.a = parseInt(hash, 16);
    }

    rand() { /* mulberry32 from https://github.com/bryc/code/blob/master/jshash/PRNGs.md */
        this.a |= 0;
        this.a = this.a + 0x6D2B79F5 | 0;
        let t = Math.imul(this.a ^ this.a >>> 15, 1 | this.a);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

const hashRand = new HashSeededRandom(TOKEN_DATA.tokenHash);
