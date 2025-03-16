// @ts-check
import globals from 'globals'
import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'

export default tseslint.config({
    files: ['{src,test}/**/*.{js,mjs,cjs,ts}'],
    languageOptions: { globals: globals.browser },
    rules: {
        '@typescript-eslint/no-explicit-any': 'warn',
        'no-unused-vars': 'warn',
    },
    extends: [eslint.configs.recommended, tseslint.configs.recommended],
})
