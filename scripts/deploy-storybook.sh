#!/usr/bin/env bash

# validate arguments
repository=$1

if [[ -z $repository ]]; then
    echo "Arguments missing"
    exit
fi

# abort on errors
set -e

# build
npm run storybook:build

# navigate into the build output directory
cd storybook-static

# publish
git init
git checkout -b main
git add -A
git commit -m 'deploy'
git push -f "git@github.com:$repository.git" main:storybook-gh-pages

cd -
