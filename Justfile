default: dev

dev:
    npm run dev

build:
    npm run build

preview:
    npm run preview

install:
    npm install

clean:
    rm -rf dist node_modules

# Install deps then start dev server
setup: install dev
