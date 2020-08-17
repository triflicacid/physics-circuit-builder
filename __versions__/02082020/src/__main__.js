async function __main__() {
    await Page.file.load('demo');
    Page.control.start();
    Page.control._gridSnapping = true;
}
