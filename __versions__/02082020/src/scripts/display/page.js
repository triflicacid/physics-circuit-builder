const Page = {
    /**
     * Current control object
     * @type {Control}
     */
    control: undefined,

    /**
     * The parent element of body
     */
    window: document.getElementById("window"),

    /**
     * Container for canvas (ID)
     * @type {String}
     */
    container: "canvas-container",

    /**
     * Array of open popups
     * @type {Popup[]}
     */
    openPopups: [],

    /**
     * Object reference (by ID) of all popups
     */
    popupStore: {},

    tab: {
        control: document.querySelector('.menu a[data-target="control"]'),
        components: document.querySelector('.menu a[data-target="components"]'),
        analyse: document.querySelector('.menu a[data-target="analyse"]'),

        /**
         * Select a tab element to view
         * @param  {HTMLEmement} tab Tab element
         */
        select(tab) {
            const wasOpen = tab.classList.contains("open");
            for (let tabContent of document.querySelectorAll(
                    ".menu-tabs .menu-tab"
                )) {
                tabContent.classList.remove("open");
                tabContent.setAttribute("hidden", "hidden");
            }

            for (let tabLink of document.querySelectorAll(".menu li a")) {
                tabLink.classList.remove("open");
            }

            if (tab instanceof HTMLElement) {
                let target = document.querySelector(
                    "[tab-target='" + tab.dataset.target + "']"
                );
                if (wasOpen) {
                    target.classList.remove("open");
                    target.setAttribute("hidden", "hidden");
                } else {
                    tab.classList.add("open");
                    target.classList.add("open");
                    target.removeAttribute("hidden");
                }
            }
        },

        /**
         * Hide a tab element
         * @param  {HTMLEmement} tab Tab element
         */
        hide(tab) {
            tab.classList.remove("open");
            const target = document.querySelector(
                "[tab-target='" + tab.dataset.target + "']"
            );
            target.classList.remove("open");
            target.setAttribute("hidden", "hidden");
        },
    },

    file: {
        tabLink: document.querySelector('a[data-target="file"]'),
        files: [],

        /**
         * Popup for when opening a file
         * @type {Popup}
         */
        openFilePopup: new Popup("Open A File...", "...").autoDelete(false),

        /**
         * Popup for when closing a file
         * @type {Popup}
         */
        closeFilePopup: new Popup(
            "Close File",
            "Are you sure you want to close this file?",
            "Any unsaved changed will be lost."
        ).autoDelete(false),

        /**
         * Update file[] list
         * @return {String[]} list of files
         */
        async updateList() {
            let list = await Server.getFiles("json");
            list = JSON.parse(list);
            Page.file.files = list;

            // Update popup
            Page.file.openFilePopup.msg(
                "<div class='list'>" + Page.file.fileList() + "</div>"
            );

            return Page.file.files;
        },

        /**
         * Load a given file
         * @param  {String} file    Filename
         * @param  {Function} callback  Function to execute after loaded
         */
        async load(file, callback = undefined) {
            if (Page.control instanceof Control) {
                Page.file.openFilePopup.close();
                new Popup(
                        "Cannot Open File",
                        "Unable to open file " +
                        file +
                        " as another file is already open."
                    )
                    .mode("warn")
                    .open();
            } else {
                let data;
                try {
                    let filename = file.replace(".json", "");
                    data = await Server.getFile(filename, true);
                } catch (e) {
                    Page.file.openFilePopup.close();
                    new Popup(
                            "Unable to open file",
                            "Unable to open file '" + file + "': " + e
                        )
                        .mode("error")
                        .open();
                    return;
                }
                Page.file.openFilePopup.close();
                Page.tab.hide(Page.file.tabLink);

                Page.control = new Control();
                Page.control.load(data, callback);
                Page.control._file = file;

                Page.controls.afterFileOpened();
            }
        },

        /**
         * Get fileList HTML
         * @return {String}
         */
        fileList() {
            let html = "<table>";
            Page.file.files.forEach((file) =>
                (html += `<tr><td><span class='file-icon'>&#x1f5ce;</span> <span class='link' onclick='Page.file.load("${file}");'>${file}</span></td></tr>`)
            );
            html += "</table>";
            return html;
        },

        /**
         * Save the current control
         */
        save() {
            Page.tab.hide(Page.file.tabLink);
            if (Page.isCircuitOpen()) {
                let filename = Page.control._file || "new";
                filename = filename.replace(".json", "");

                // Save popup
                new Popup("Save")
                    .msg(
                        "<center>",
                        `<b>Save as: </b><input type='text' value='${filename}' />`,
                        "</center>"
                    )
                    .extraButton("Save", Page.file._save)
                    .open();
            } else {
                const warn = new Popup(
                    "Cannot Save",
                    "There is nothing to save."
                );
                warn.mode("warn");
                warn.open();
            }
        },

        /**
         * Actually save the open circuit to a given file
         * @param  {HTMLButtonElement} btn      Button pressed; called from popup
         */
        async _save(btn) {
            // Get filename form <input />
            if (!(btn instanceof HTMLButtonElement))
                throw new TypeError(`Expected HTMLButtonElement, got unknown`);
            const file = btn.parentNode.parentNode.querySelector("input").value;

            if (
                typeof file !== "string" ||
                file.length === 0 ||
                file.match(/[^A-Za-z0-9_]/g)
            ) {
                new Popup(
                        "Cannot save file",
                        "Invalid filename. Must be a string only containing letters, numbers and underscore."
                    )
                    .mode("error")
                    .open();
                console.error("Invalid filename:", file);
                return false;
            }
            const filename = file + ".json";

            // Get control's JSON
            let json;
            try {
                json = JSON.stringify(Page.control.getData());
            } catch (e) {
                new Popup("Cannot Save")
                    .mode("error")
                    .msg("Unable to get data of circuit:", e)
                    .open();
                console.error(
                    "==== [CIRCUIT SAVE ERROR (Page.file.save)] ====\n",
                    e
                );
                return;
            }

            // Try to save it normally
            try {
                // Try to put file
                await Server.putFile(filename, json);
            } catch (e) {
                if (e === "E404") {
                    await Server.createFile(filename);
                    await Server.putFile(filename, json);
                } else {
                    new Popup("Cannot Save File", "Internal Error:", e)
                        .mode("error")
                        .open();
                    console.error(e);
                    return true;
                }
            }

            // Update file tab
            Page.file.tabLink.innerText = "File: " + filename;

            // Update files
            Page.file.updateList();

            return true;
        },

        /**
         * Attempt to create a new instance
         */
        new() {
            if (Page.isCircuitOpen()) {
                const warn = new Popup(
                    "Cannot Create New",
                    "There is already a circuit instance open."
                );
                warn.mode("warn");
                warn.open();
            } else {
                Page.control = new Control();
                Page.control.load();
            }
            Page.tab.hide(Page.file.tabLink);
            Page.controls.afterFileOpened();
        },

        /**
         * Close control
         * - NB called from popup (Page.file.closeFilePopup)
         * @param {HTMLButtonElement} btn   Button activiated by in popup
         */
        close(btn) {
            if (Page.control instanceof Control) {
                Page.control.terminate();
                Page.control = undefined;
                Page.tab.hide(Page.file.tabLink);
                Page.file.closeFilePopup.close();
                Page.controls.afterFileClosed();
            } else {
                const warn = new Popup(
                    "Cannot Close File",
                    "There is no file open to close."
                );
                warn.mode("warn");
                warn.open();
            }
            return true;
        },

        /**
         * Delete file
         */
        delete() {
            // If not a file, close...
            if (Page.control._file == null) {
                Page.file.closeFilePopup.open();
            } else {
                const file = Page.control._file;
                new Popup(
                        "Delete File Confirmation",
                        "Delete file " + file + "? It will be unrecoverable."
                    )
                    .mode("warn")
                    .extraButton("Delete", (btn) => {
                        try {
                            Page.file.close();
                            Server.deleteFile(file);
                            Page.file.updateList();
                        } catch (e) {
                            new Popup(
                                    "Error Deleting File",
                                    "Internal Error:",
                                    e
                                )
                                .mode("error")
                                .open();
                            console.error(e);
                        }
                        return true;
                    })
                    .open();
            }
        },
    },

    // Controls for Page.control
    controls: {
        /**
         * Component we are currently inserting
         * - Triggered by click on buttons in "Components"  tab
         * - Contains dataset.component of <a />
         * @type {String}
         */
        insertingComponent: null,

        /**
         * Stores component whose info id being displayed by analyse()
         * @type {Component}
         */
        componentShowingInfo: null,

        /**
         * Initiate all controls
         */
        init() {
            // Tabs
            Page.controls.componentTab = document.querySelector(
                '.menu [data-target="components"]'
            );

            // Controls
            Page.controls.lightSlider = document.getElementById(
                "control-light-range"
            );
            Page.controls.lightText = document.getElementById(
                "control-light-text"
            );
            Page.controls.lightSlider.addEventListener("input", (event) => {
                const val = +event.target.value;
                Page.control.setLightLevel(val);
                Page.controls.lightText.innerText = val;
            });

            Page.controls.temperatureSlider = document.getElementById(
                "control-temp-range"
            );
            Page.controls.temperatureText = document.getElementById(
                "control-temp-text"
            );
            Page.controls.temperatureSlider.addEventListener(
                "input",
                (event) => {
                    const val = +event.target.value;
                    Page.control.setTemp(val);
                    Page.controls.temperatureText.innerText = val;
                }
            );

            Page.controls.pixelMetreRange = document.getElementById(
                "control-pxm-range"
            );
            Page.controls.pixelMetreText = document.getElementById(
                "control-pxm-text"
            );
            Page.controls.pixelMetreRange.addEventListener(
                "input",
                (event) => {
                    const val = +event.target.value;
                    Page.control.PIXELS_PER_CM = val;
                    Page.controls.pixelMetreText.innerText = val;
                }
            );

            Page.controls.isRunning = document.getElementById(
                "control-running"
            );
            Page.controls.isRunning.addEventListener("click", (event) =>
                event.target.checked ?
                Page.controls.start() :
                Page.controls.stop()
            );

            Page.controls.showInfo = document.getElementById(
                "control-showInfo"
            );
            Page.controls.showInfo.addEventListener(
                "click",
                (event) => (Page.control._showInfo = event.target.checked)
            );

            Page.controls.isDebug = document.getElementById("control-debug");
            Page.controls.isDebug.addEventListener("click", (event) =>
                Page.control.debug(event.target.checked)
            );

            Page.controls.displayMode = document.getElementById(
                "control-displayMode"
            );
            Page.controls.displayMode.addEventListener(
                "change",
                (event) => (Page.control._mode = +event.target.value)
            );

            Page.controls.wireCreation = document.getElementById(
                "control-wireCreation"
            );
            Page.controls.wireCreation.addEventListener(
                "click",
                (event) =>
                (Page.control._enableCreateWire = event.target.checked)
            );

            Page.controls.USMode = document.getElementById("control-US");
            Page.controls.USMode.addEventListener("click", (event) =>
                Page.control.american(event.target.checked)
            );

            // Page.controls.fpsSlider = document.getElementById(
            //     "control-fps-range"
            // );
            // Page.controls.fpsText = document.getElementById("control-fps-text");
            // Page.controls.fpsSlider.addEventListener("input", (event) => {
            //     const fps = +event.target.value;
            //     Page.control.frameRate(fps);
            //     Page.controls.fpsText.innerText = Page.control._fps;
            // });

            // Components button
            let links = document.querySelectorAll(
                '.menu-tab[tab-target="components"] a[data-component]'
            );
            for (let link of links) {
                const component = link.dataset.component;
                link.classList.add("insert-component");

                const img = document.createElement("img");
                img.dataset.component = component;
                img.src = "src/images/" + toClassName(component) + ".png";
                img.setAttribute("click", capitalise(component));
                link.appendChild(img);

                link.addEventListener("click", (event) => {
                    Page.controls.clickInsertComponentBtn(event.target);
                    event.stopPropagation();
                });
            }

            // Event listener for inserting components
            document.body.addEventListener("click", (event) => {
                if (
                    typeof Page.controls.insertingComponent === "string" &&
                    Page.openPopups.length === 0
                ) {
                    Page.controls.clickInsertComponentBody(
                        event.clientX,
                        event.clientY
                    );
                }
            });

            // Analysis tab HTML
            Page.controls._analyse = {
                name: document.getElementById("analyse-name"),

                analyseCircuit: document.getElementById('analyse-circuit'),
                cName: document.getElementById("analyse-c-name"),
                cResistance: document.getElementById("analyse-c-resistance"),
                cVoltage: document.getElementById("analyse-c-voltage"),
                cPower: document.getElementById("analyse-c-power"),
                cCurrent: document.getElementById("analyse-c-current"),
                cMaxCurrent: document.getElementById("analyse-c-maxCurrent"),
                cIsOn: document.getElementById("analyse-c-isOn"),
                cIsBlown: document.getElementById("analyse-c-isBlown"),
                cExternLight: document.getElementById("analyse-c-externLight"),
                cExternTemp: document.getElementById("analyse-c-externTemp"),
                cOther: document.getElementById("analyse-c-other"),
                cConfig: document.getElementById("analyse-config"),
                cConns: document.getElementById("analyse-c-conns"),

                analyseWire: document.getElementById('analyse-wire'),
                wHasRes: document.getElementById("analyse-w-hasRes"),
                wRes: document.getElementById("analyse-w-res"),
                wLength: document.getElementById("analyse-w-length"),
                wMaterial: document.getElementById("analyse-w-material"),
                wRadius: document.getElementById("analyse-w-radius"),
                wVolume: document.getElementById("analyse-w-volume"),
            };
        },

        /**
         * Start running Page.control
         */
        start() {
            Page.control.start();
            Page.controls.isRunning.checked = 1;
        },

        /**
         * Stop running Page.control
         */
        stop() {
            Page.control.stop();
            Page.controls.isRunning.checked = 0;
        },

        /**
         * Prepare controls (called after new circuit is installed)
         */
        prep() {
            Page.controls.lightSlider.value = Page.control._lightLevel;
            eventOn(Page.controls.lightSlider, "input");

            Page.controls.temperatureSlider.setAttribute(
                "min",
                Control.MIN_TEMP
            );
            Page.controls.temperatureSlider.setAttribute(
                "max",
                Control.MAX_TEMP
            );
            Page.controls.temperatureSlider.value = Page.control._temperature;
            eventOn(Page.controls.temperatureSlider, "input");

            Page.controls.pixelMetreRange.value = Page.control.PIXELS_PER_CM;
            Page.controls.pixelMetreText.innerText = Page.control.PIXELS_PER_CM;

            // Page.controls.fpsSlider.value = Page.control._fps;
            // eventOn(Page.controls.fpsSlider, "input");

            if (Page.control._showInfo) Page.controls.showInfo.click();
            if (Page.control._enableCreateWire)
                Page.controls.wireCreation.click();
            if (Page.control._running) Page.controls.isRunning.click();
            if (Page.control._debug) Page.controls.isDebug.click();
        },

        /**
         * Handle onClick event of .insert-component button
         * @param  {HTMLElement} a    Element clicked on (<img /> or <a />)
         */
        clickInsertComponentBtn(a) {
            if (typeof Page.controls.insertingComponent === "string") return;

            const component = a.dataset.component;
            if (typeof component !== "string" || component.length === 0) {
                console.log(a);
                throw new TypeError(`Cannot find dataset.component (^).`);
            }

            Page.controls.insertingComponent = component;
            Page.controls.afterInsertInit();
        },

        /**
         * Handle the "drop" of the component
         * @param  {Number} x   X coordinate to insert component
         * @param  {Number} y   Y coordinate to insert component
         * @return {Boolean}    Was the insert successful
         */
        clickInsertComponentBody(x, y) {
            // Check if canvas contains coords
            const contains = Page.control.contains(x, y);

            if (contains) {
                const component = Page.controls.insertingComponent;
                Page.controls.afterInsertEnd();
                const coords = Page.control.coordsOnCanvas(x, y);

                try {
                    Page.control.createComponent(component, ...coords);
                    Page.control.render();
                } catch (e) {
                    // 'Harmless' ComponentError
                    if (e instanceof ComponentError) {
                        new Popup("Cannot Insert Component", e.message)
                            .mode("error")
                            .open();
                        console.error(e);
                    } else {
                        // Other error. Throw as this was un-generated.
                        throw e;
                    }
                }
            } else {
                new Popup("Unable to Insert Component", "You didn't click on the circuit - cannot insert component outside of the circuit")
                    .mode("warn")
                    .open();
                Page.controls.afterInsertEnd();
                return false;
            }
        },

        /**
         * Stuff to execute after a file/instance is opened
         */
        afterFileOpened() {
            // Show all "if-file-open" tabs
            let els = document.getElementsByClassName("ifFileOpen");
            for (let el of els) Page.show(el);

            // Hide all "if-file-closed" tabs
            els = document.getElementsByClassName("ifFileClosed");
            for (let el of els) Page.hide(el);

            Page.file.tabLink.innerText =
                "File: " + (Page.control._file || "(new)");
            Page.controls.prep();
        },

        /**
         * Stuff to execute after the control instance is closed
         */
        afterFileClosed() {
            // Show all "if-file-open" tabs
            let els = document.getElementsByClassName("ifFileOpen");
            for (let el of els) Page.hide(el);

            // Hide all "if-file-closed" tabs
            els = document.getElementsByClassName("ifFileClosed");
            for (let el of els) Page.show(el);

            Page.file.tabLink.innerText = "File";
        },

        /**
         * Stuff to execute after inert button has been pressed (component)
         */
        afterInsertInit() {
            document.querySelector('img[data-component="' + Page.controls.insertingComponent + '"]').classList.add("inserting");
            Page.controls.componentTab.innerHTML = "Components: inserting " + Page.controls.insertingComponent;
            Page.window.classList.add("insertingComponent");
            // Page.tab.hide(Page.controls.componentTab);
        },

        /**
         * Stuff to execute after inserted component
         */
        afterInsertEnd() {
            document
                .querySelector(
                    'img[data-component="' +
                    Page.controls.insertingComponent +
                    '"]'
                )
                .classList.remove("inserting");
            Page.controls.insertingComponent = null;
            Page.window.classList.remove("insertingComponent");
            Page.controls.componentTab.innerHTML = "Components";
        },

        /**
         * Analyse a certain component
         * @param  {Component} c    Component to analyse, or '1' to re-analyse current component
         */
        analyse(c) {
            if (c === 1) c = Page.controls.componentShowingInfo;

            const info = Page.controls._analyse;
            Page.controls.componentShowingInfo = c;

            Page.hide(info.analyseCircuit);
            Page.hide(info.analyseWire);

            if (Control.isComponent(c)) {
                Page.show(info.analyseCircuit);
                // Tab text
                info.name.innerText = c.toString();

                // "Component Info" table info
                info.cName.innerText = c.toString();
                info.cResistance.innerHTML = numberFormat(c.resistance, 3);
                info.cVoltage.innerHTML = numberFormat(c.voltage, 3);
                info.cPower.innerHTML = numberFormat(c.power(), 3);
                info.cCurrent.innerHTML = numberFormat(c.current, 3);
                info.cMaxCurrent.innerHTML = !isFinite(c.maxCurrent) ||
                    Number.MAX_SAFE_INTEGER >= c.maxCurrent ?
                    "&infin;" :
                    numberFormat(c.maxCurrent, 3);
                info.cIsOn.innerHTML = getHtmlBoolString(c.isOn());
                info.cIsBlown.innerHTML = getHtmlBoolString(c.isBlown());
                info.cExternLight.innerHTML = roundTo(c._lightRecieving, 2);
                info.cExternTemp.innerHTML = roundTo(c._externalTemp, 2);

                /*** Additional info ***/
                let other = [];

                // If luminous...
                if (typeof c._lpw === "number")
                    other.push([
                        "Luminoscity",
                        roundTo(c.luminoscity(), 2) + "lm @ " + c._lpw + "lm/w",
                    ]);

                if (c instanceof Circuit.Bulb) {
                    info.cName.innerText =
                        c.wattage() + "-Watt " + c.constructor.name;
                    other.push(
                        ["Brightness", roundTo(c.brightness() * 100, 1) + "%"],
                        ["Old Symbol", getHtmlBoolString(c._old)]
                    );
                }

                if (c instanceof Circuit.Resistor)
                    other.push([
                        "<abbr title='American circuit symbol'>US</abbr>",
                        getHtmlBoolString(c._american),
                    ]);
                if (c instanceof Circuit.Cell || c instanceof Circuit.Battery)
                    other.push([
                        "Dir",
                        c._dir === Circuit.Cell.LEFT ? "Left" : "Right",
                    ]);
                if (c instanceof Circuit.ACPowerSupply)
                    other.push(["Freq", c.hertz() + "Hz"]);
                if (c instanceof Circuit.DCPowerSupply)
                    other.push(
                        ["Max Voltage", c._maxVoltage + "V"],
                        [
                            "<abbr title='What to change voltage by onScroll'>Sensitivity</abbr>",
                            "&Delta;" + c.sensitivity() + "V",
                        ]
                    );
                if (c instanceof Circuit.Switch)
                    other.push([
                        "State",
                        `<span style='color: ${
                            c.isOpen() ? "crimson" : "green; font-weight: bold"
                        };'>${c.isOpen() ? "Open" : "Closed"}</span>`,
                    ]);
                if (c instanceof Circuit.Buzzer)
                    other.push(
                        ["Volume", c.volume() * 100 + "%"],
                        ["Mute", getHtmlBoolString(c.mute())],
                        ["Freq", c.frequency() + "Hz"]
                    );
                if (c instanceof Circuit.Battery) {
                    info.cVoltage.innerHTML = c._cells + " &times; " + c._cellVoltage + "V = " + c.voltage;
                    info.cName.innerHTML = c._cells + "-Cell Battery";
                }
                if (c instanceof Circuit.Diode)
                    other.push([
                        "Direction",
                        c._dir === Circuit.Diode.LEFT ? "Left" : "Right",
                    ]);
                if (c instanceof Circuit.LightEmittingDiode) {
                    let rgb = "rgb(" + c.getColour().join(", ") + ")";
                    other.push([
                        "Colour",
                        "<span style='background-color: " +
                        rgb +
                        "'>hsb(" +
                        c.getColour(true).join(", ") +
                        ")<br>" +
                        rgb +
                        "</span>",
                    ]);
                }
                if (c instanceof Circuit.Connector) {
                    if (!c._isEnd)
                        info.cResistance.innerHTML =
                        "<abbr title='Resistance of connected circuits in parallel'>" +
                        c.resistance +
                        "</abbr>";
                    if (!(c instanceof Circuit.TwoWaySwitch))
                        other.push(
                            ["Type", c._isEnd ? "Joiner" : "Splitter"],
                            ["Inputs", c._inputCount + " / " + c._inputMax],
                            ["Outputs", c._outputCount + " / " + c._outputMax]
                        );
                }
                if (c instanceof Circuit.TwoWaySwitch)
                    other.push(["Switch Pos", c._exec]);
                if (c instanceof Circuit.Capacitor)
                    other.push(
                        ["Capacitance", c._capacitance + "µF"],
                        ["Target", c.targetVoltage + "V"],
                        ["State", c.getState()]
                    );
                if (c instanceof Circuit.Motor)
                    other.push(
                        [
                            `<abbr title='If current = maxCurrent '>Max Speed</abbr>`,
                            roundTo(rad2deg(c.K), 1) + "&deg;",
                        ],
                        ["Speed", roundTo(rad2deg(c.delta()), 2) + "&deg; / frame"],
                        ["Angle", c.angle()]
                    );
                if (c instanceof Circuit.Heater)
                    other.push(
                        ["Temp", c.temp() + "°C"],
                        ["Max Temp", c.maxTemp() + "°C"],
                        ["Capacity", roundTo(c.percent()) + "%"],
                        ["Efficiency", c._efficiency + "%"]
                    );
                if (c instanceof Circuit.Thermistor)
                    other.push(
                        [
                            "temp:resistance",
                            (c._mode === Circuit.Thermistor.NTC ?
                                "Negative" :
                                "Positive ") + " Correlation",
                        ],
                        ["Temp Range", c._min + "°C to " + c._max + "°C"]
                    );
                if (c instanceof Circuit.MaterialContainer)
                    other.push(
                        ["Material", nicifyString(c.material, ' ')],
                        ["Length", roundTo(c._w / Page.control.PIXELS_PER_CM, 3) + 'cm (' + c._w + 'px)'],
                        ["Volume", numberFormat(c.volume(true), 3) + 'cm³ (' + Math.round(c.volume(false)) + 'px)'],
                    );
                if (c instanceof Circuit.WireContainer)
                    other.push(
                        ["Material", nicifyString(c.material, ' ')],
                        ["Length", roundTo(c.length(true), 3) + 'cm (' + c.length(false) + 'px)'],
                        ["Volume", numberFormat(c.volume(true), 3) + 'cm³ (' + Math.round(c.volume(false)) + 'px)'],
                    );

                let otherHTML = "";
                for (let row of other) {
                    otherHTML += `<tr><th>${row[0]}</th><td>${row[1]}</td></tr>`;
                }
                info.cOther.innerHTML = otherHTML;

                // Config
                const config = c.constructor.config;
                if (Array.isArray(config)) {
                    const fields = [];
                    for (let i = 0; i < config.length; i++) {
                        const cobj = config[i];
                        const field = {
                            field: cobj.field,
                            type: cobj.type,
                            name: cobj.name,
                            html: "",
                        };
                        switch (cobj.type) {
                            case "boolean":
                                field.html = `<input type='radio' name='config-${
                                    cobj.field
                                }' onclick='Page.controls.config(${i}, this)' value='0'${
                                    c["_" + cobj.field] ? "" : " checked"
                                } /> ${getHtmlBoolString(false)}
                                            <input type='radio' name='config-${
                                                cobj.field
                                            }' onclick='Page.controls.config(${i}, this)' value='1'${
                                    c["_" + cobj.field] ? " checked" : ""
                                } /> ${getHtmlBoolString(true)}`;
                                break;
                            case "number":
                                if (cobj.slider) {
                                    field.html = `<input type='range' min='${cobj.min}' step='${cobj.step == undefined ? 1 : cobj.step}' value='${c["_" + cobj.field]}' max='${cobj.max}' oninput='Page.controls.config(${i}, this); document.getElementById("c-config-${cobj.field}-value").innerText = this.value;' /> <span id='c-config-${cobj.field}-value'>${c["_" + cobj.field]}</span>`;
                                } else {
                                    field.html = `<input type='number' min='${cobj.min}' value='${c["_" + cobj.field]}' max='${cobj.max}' onchange='Page.controls.config(${i}, this);' />`;
                                }
                                break;
                            case "dir":
                                field.html = `<input type='radio' name='config-${
                                    cobj.field
                                }' onclick='Page.controls.config(${i}, this)' value='0'${
                                    c["_" + cobj.field] ? "" : " checked"
                                } /> Left
                                <input type='radio' name='config-${
                                    cobj.field
                                }' onclick='Page.controls.config(${i}, this)' value='1'${
                                    c["_" + cobj.field] ? " checked" : ""
                                } /> Right`;
                                break;
                            case "option": {
                                if (cobj.options.length > 2) {
                                    field.html += `<select onchange='Page.controls.config(${i}, this)'>`;
                                    for (let option of cobj.options) {
                                        field.html += `<option value='${option.value}'${c["_" + cobj.field] === option.value? " selected" : ""}>${option.name}</option>`;
                                    }
                                    field.html += '</select>';
                                } else {
                                    for (let option of cobj.options) {
                                        field.html += `<input type='radio' name='config-${cobj.field}' value='${option.value}'${c["_" + cobj.field] === option.value? " checked" : ""} onclick='Page.controls.config(${i}, this);' /> ${option.name}`;
                                    }
                                }
                                break;
                            }
                            default:
                                console.warn(
                                    `${c.toString()} : config('${
                                        cobj.field
                                    }'): type '${cobj.type}' is not available`
                                );
                                continue;
                        }
                        fields.push(field);
                    }

                    // Show config info
                    let html = "";
                    for (let field of fields) {
                        html += `<tr><th title='${c.toString()}.${field.field}: ${field.type}'>${field.name}</th><td>${field.html}</td></tr>`;
                    }
                    info.cConfig.innerHTML = html;

                    // Connection info
                    const inputs = c._inputs.length;
                    const outputs = c._outputs.length;
                    const rows = Math.max(inputs, outputs);
                    let tmp;
                    html = "";
                    for (let i = 0; i < rows; i++) {
                        html += '<tr>';

                        if (i >= inputs) {
                            html += '<td colspan="2" />';
                        } else {
                            tmp = c._inputs[i]._input;
                            html += `<td>${tmp.toString()}</td><td><span class='del-btn' title='Delete' onclick='Page.controls.clickDeleteComponent(${tmp._id}, true);'>&times;</span></td>`;
                        }

                        if (i >= outputs) {
                            html += '<td colspan="2" />';
                        } else {
                            tmp = c._outputs[i]._output;
                            html += `<td>${tmp.toString()}</td><td><span class='del-btn' title='Delete' onclick='Page.controls.clickDeleteComponent(${tmp._id}, true);'>&times;</span></td>`;
                        }

                        html += '</tr>';
                    }
                    info.cConns.innerHTML = html;
                }
            } else if (c instanceof Circuit.Wire) {
                Page.show(info.analyseWire);
                info.name.innerText = c.toString();

                info.wHasRes.innerHTML = '<input type="radio" name="analyse-w-hasRes-radio" onclick="Page.controls.componentShowingInfo._hasResistance = true; Page.controls.analyse(1);" ' + (c._hasResistance ? "checked " : "") + '/> <span style="color: green;">Yes</span>';
                info.wHasRes.innerHTML += '<input type="radio" name="analyse-w-hasRes-radio" onclick="Page.controls.componentShowingInfo._hasResistance = false; Page.controls.analyse(1);" ' + (c._hasResistance ? "" : "checked ") + '/> <span style="color: crimson;">No</span>';

                info.wRes.innerText = numberFormat(c.resistance, 4);

                const length = c.length;
                info.wLength.innerText = `${roundTo(length / Page.control.PIXELS_PER_CM, 2)}cm (${Math.round(length)}px)`;

                if (c._hasResistance) {
                    const onclick = `Page.controls.componentShowingInfo.radiusPx(+this.value); document.getElementById("analyse-w-radius-text").innerText = roundTo(Page.controls.componentShowingInfo.radiusCm(), 3) + "cm (" + roundTo(Page.controls.componentShowingInfo.radiusPx(), 1) + "px)";`;
                    let html = `<input type='range' min='${Circuit.Wire.MIN_RADIUS}' value='${c.radiusPx()}' step='0.1' max='${Circuit.Wire.MAX_RADIUS}' oninput='${onclick}' onchange='Page.controls.analyse(1);' /> <span id='analyse-w-radius-text'>${roundTo(c.radiusCm(), 3)}cm (${roundTo(c.radiusPx(), 1)}px)</span>`;
                    info.wRadius.innerHTML = html;
                } else {
                    info.wRadius.innerText = roundTo(1.5 / Page.control.PIXELS_PER_CM, 3) + 'cm';
                }

                info.wVolume.innerHTML = numberFormat(c.volume(true), 3);

                let html = "<select onchange='Page.controls.componentShowingInfo._material = +this.value; Page.controls.analyse(1);'>";
                for (let i = 0; i < Circuit.Wire.MATERIALS_KEYS.length; i++) {
                    const material = Circuit.Wire.MATERIALS_KEYS[i];
                    html += `<option value="${i}"${c._material === i ? " selected" : ""}>${nicifyString(material, ' ')} (${numberFormat(Circuit.Wire.MATERIALS[material].resistance, 2) } Ω/m³)</option>`;
                }
                info.wMaterial.innerHTML = html + "</select>";
            } else {
                // Clear all HTML
                for (let prop in info) {
                    if (info.hasOwnProperty(prop) && (prop[0] === 'c' || prop[0] === 'w')) {
                        info[prop].innerHTML = "";
                    }
                }
                info.name.innerText = "none";
            }
        },

        /**
         * CHange a private configurable field
         * @param  {Number} cid     Configuration field ID
         * @param  {HTMLElement} elem   Elemm to get value from
         */
        config(cid, elem) {
            if (
                Page.control instanceof Control &&
                Control.isComponent(Page.controls.componentShowingInfo)
            ) {
                const config = Page.controls.componentShowingInfo.constructor.config;
                if (Array.isArray(config)) {
                    const field = config[cid];
                    let value = elem.value;
                    let analyseAfter = false;
                    switch (field.type) {
                        case "boolean":
                            value = value === "1" || value === "true";
                            Page.controls.analyse(1);
                            break;
                        case "number":
                            value = +value;
                            if (isNaN(value)) return;
                            break;
                        case "dir":
                            value = +value;
                            analyseAfter = true;
                            break;
                        case "option":
                            switch (field.optionType) {
                                case 'boolean':
                                    value = value === "1" || value === "true";
                                    break;
                                case "number":
                                    value = +value;
                                    if (isNaN(value)) return;
                                    break;
                            }
                            analyseAfter = true;
                            break;
                        default:
                            console.warn(
                                `Cannot set field '${field.field}' to '${value}': unknown argument mode '${field.type}'`
                            );
                            return;
                    }

                    if (field.method) {
                        Page.controls.componentShowingInfo[field.field](value);
                    } else {
                        Page.controls.componentShowingInfo[
                            "_" + field.field
                        ] = value;
                    }

                    if (analyseAfter) Page.controls.analyse(1);
                }
            }
        },

        /**
         * Click on delete (x) button in analyse component
         * @param  {Number} id  ID of component. Default is Page.componentShowingInfo._id;
         * @param  {Boolean} reanalyse  Call Page.controls.analyse() after?
         */
        clickDeleteComponent(id, reanalyse = true) {
            if (id === undefined && Control.isComponent(Page.controls.componentShowingInfo))
                id = Page.controls.componentShowingInfo._id;

            if (typeof id === 'number') {
                const c = Page.control.components[id];
                if (Control.isComponent(c) && window.confirm(`Remove component '${c.toString()}' from the circuit?`)) {
                    c.remove();

                    // If reanalyse, update analysis section...
                    if (reanalyse) {
                        if (c === Page.controls.componentShowingInfo) {
                            Page.controls.analyse(null);
                        } else {
                            Page.controls.analyse(Page.controls.componentShowingInfo);
                        }
                    }
                }
            } else {
                console.warn('clickDeleteComponent: no ID provided');
            }
        },
    },

    /**
     * Show a given element
     * @param {HTMLElement} elem Element to show
     */
    show(elem) {
        elem.removeAttribute("hidden");
    },

    /**
     * Hide a given element
     * @param {HTMLElement} elem Element to hide
     */
    hide(elem) {
        elem.setAttribute("hidden", "hidden");
    },

    /**
     * Is a circuit open?
     * @return {Boolean}
     */
    isCircuitOpen() {
        return Page.control instanceof Control;
    },
};