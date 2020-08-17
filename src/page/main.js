export default async function (Page) {
    await Page.file.load('demo');
    Page.control.start();
    Page.control._gridSnapping = true;
}