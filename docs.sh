#!/usr/bin/env bash

rm -rf ./docs
firedoc ./ --theme notab
cd ./docs

git init && git checkout -b gh-pages
git add .
git commit -a -m 'docs'
git push https://github.com/weflex/node-orgmode gh-pages -f

cd ../