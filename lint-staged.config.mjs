const config = {
  '**/*.{js,cjs,mjs,ts,jsx,tsx}':
    "eslint --rule 'no-console: error' --rule 'prettier/prettier: error'",
}

export default config
