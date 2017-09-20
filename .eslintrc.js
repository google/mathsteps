module.exports = {
    "env": {
        "browser": true,
        "es6": true
    },
    "plugins": [
        "sort-requires"
    ],
    "extends": "eslint:recommended",
    "parserOptions": {
        "sourceType": "module"
    },
    "globals": {
        "require": true,
        "module": true,
        "describe": true,
        "it": true
    },
    "rules": {
        "indent": [
            "error",
            2
        ],
        "linebreak-style": [
            "error",
            "unix"
        ],
        "quotes": [
            "error",
            "single"
        ],
        "semi": [
            "error",
            "always"
        ],
        "eqeqeq": [
            "error",
            "always"
        ],
        "prefer-const": [
            "error", {
                "destructuring": "any"
            }
        ],
        "no-trailing-spaces": [
            "error"
        ],
        "object-shorthand": [
            "error",
            "always", {
                "avoidQuotes": true
            }
        ],
        "brace-style": [
            "error",
            "stroustrup",
            {
                "allowSingleLine": true
            }
        ],
        "sort-requires/sort-requires": [
            "error"
        ],
        "keyword-spacing": [
            "error"
        ],
        "strict": [
            "error"
        ],
        "eol-last": [
            "error",
            "always"
        ],
        "no-multiple-empty-lines": [
            "error", 
            {
                "max": 2,
                "maxEOF": 1
            }
        ],
        "no-trailing-spaces": [
            "error"
        ]
    }
};
