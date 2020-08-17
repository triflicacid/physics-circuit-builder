(function() {
    // Tab Menu
    let tabs = document.querySelectorAll('.menu li a');
    for (let tab of tabs) {
        tab.onclick = function() {
            Page.tab.select(tab);
        };
    }

    // Tab Contents
    tabs = document.querySelectorAll('.menu-tabs .menu-tab');
    for (let tab of tabs) {
        tab.setAttribute('hidden', 'hidden');
    }

    // Popups
    let popups = document.querySelectorAll('.popups .popup');
    for (let popup of popups) {
        popup.setAttribute('hidden', 'hidden');
    }
    document.getElementById('popupCover').setAttribute('hidden', 'hidden');

    // Load files
    Page.file.updateList();

    // When click on popupCOver, remove all popups
    document.getElementById('popupCover').onclick = function() {
        Page.openPopups.forEach(p => p.close());
    };

    // Hide all 'ifFileOpen' things
    let ifo = document.querySelectorAll('.ifFileOpen');
    for (let e of ifo) {
        Page.hide(e);
    }

    Page.file.closeFilePopup.extraButton('Continue & Close', Page.file.close);

    // Apple sliders
    let sliders = document.getElementsByClassName('appleSlider');
    for (let slider of sliders) {
        const id = slider.dataset.id;
        delete slider.dataset.id;
        slider.innerHTML = '<input class="toggle" id="' + id + '" type="checkbox" /><label id="control" class="control" for="' + id + '"></label><div class="atContainer"></div>';

        const toggle = slider.getElementsByClassName("toggle")[0];
        toggle.addEventListener('change', () => toggle.checked ? slider.classList.add('isChecked') : slider.classList.remove('isChecked'));
    }

    // Setup Controls
    Page.controls.init();
    Page.hide(Page.controls._analyse.analyseCircuit);
    Page.hide(Page.controls._analyse.analyseWire);

    // --- END ---
    if (typeof __main__ === 'function') {
        __main__();
    }
}());
