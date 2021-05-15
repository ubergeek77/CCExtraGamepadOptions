// Register the Switch layout as a new option
sc.GAMEPAD_ICON_OPTION.SWITCH = Object.keys(sc.GAMEPAD_ICON_OPTION).length;
sc.GAMEPAD_ICON_STYLE.SWITCH = Object.keys(sc.GAMEPAD_ICON_STYLE).length;

// Register the three Switch icon themes
sc.GAMEPAD_SWITCH_STYLE = {
    DEFAULT: 0,
    SFC: 1,
    SNES: 2,
    PRO2: 3
};

// Register the Switch icon theme option
sc.OPTIONS_DEFINITION["gamepad-switch-icon-theme"] = {
    type: "BUTTON_GROUP",
    data: sc.GAMEPAD_SWITCH_STYLE,
    init: sc.GAMEPAD_SWITCH_STYLE.DEFAULT,
    cat: sc.OPTION_CATEGORY.GAMEPAD,
    gamepadIconUpdate: true
};

// Register the Swap L/R option
sc.OPTIONS_DEFINITION["gamepad-swap-bumpers"] = {
    type: "CHECKBOX",
    init: false,
    cat: sc.OPTION_CATEGORY.GAMEPAD,
    gamepadIconUpdate: true
};

// Register the Swap LT/RT option
sc.OPTIONS_DEFINITION["gamepad-swap-triggers"] = {
    type: "CHECKBOX",
    init: false,
    cat: sc.OPTION_CATEGORY.GAMEPAD,
    gamepadIconUpdate: true
};

// Register the Swap A/B option
sc.OPTIONS_DEFINITION["gamepad-swap-ab"] = {
    type: "CHECKBOX",
    init: false,
    cat: sc.OPTION_CATEGORY.GAMEPAD,
    gamepadIconUpdate: true
};

// Register the Swap X/Y option
sc.OPTIONS_DEFINITION["gamepad-swap-xy"] = {
    type: "CHECKBOX",
    init: false,
    cat: sc.OPTION_CATEGORY.GAMEPAD,
    gamepadIconUpdate: true
};

// Modify KeyBinder to support swapped buttons
sc.KeyBinder.inject({
    // Generate an "action map" mapping actions to their corresponding buttons
    // Since this is run every time the binding is changed, this also handles the changing of the actual keycodes
    generateActionMap: function() {
        // The default action map
        var actionMap = {
            left: "gamepad-left",
            down: "gamepad-down",
            right: "gamepad-right",
            up: "gamepad-up",
            aim: "right-stick",
            "throw": "gamepad-r1",
            dash: "gamepad-l1",
            guard: "gamepad-l1",
            pause: "gamepad-pause",
            back: "gamepad-b",
            special: "gamepad-r2",
            help: "gamepad-pause",
            help2: "gamepad-x",
            help3: "gamepad-y",
            help4: "right-stick-press",
            menu: "gamepad-select",
            quick: "gamepad-l2",
            heat: "gamepad-down",
            shock: "gamepad-right",
            cold: "gamepad-up",
            wave: "gamepad-left",
            "arrow-left": "gamepad-l1",
            "arrow-right": "gamepad-r1",
            "arrow-left-off": "gamepad-l1-off",
            "arrow-right-off": "gamepad-r1-off",
            "circle-left": "gamepad-l1",
            "circle-right": "gamepad-r1",
            "page-left": "gamepad-left",
            "page-right": "gamepad-right",
            "list-up": "gamepad-l2",
            "list-down": "gamepad-r2",
            "skip-cutscene": "gamepad-y"
        };

        // Determine the buttons for each action based on the user's setting
        var throwBtn = sc.options.get("gamepad-attack") ? "gamepad-r2" : "gamepad-r1";
        var specialBtn = sc.options.get("gamepad-attack") ? "gamepad-r1" : "gamepad-r2";
        var dashBtn = sc.options.get("gamepad-dash") ? "gamepad-l2" : "gamepad-l1";
        var quickBtn = sc.options.get("gamepad-dash") ? "gamepad-l1" : "gamepad-l2";

        // Swap left and right bumpers if necessary (without changing keycodes, so the menu still scrolls left and right properly)
        if(sc.options.get("gamepad-swap-bumpers")) {
            throwBtn = throwBtn.replace("-r1", "-l1")
            specialBtn = specialBtn.replace("-r1", "-l1")
            dashBtn = dashBtn.replace("-l1", "-r1")
            quickBtn = quickBtn.replace("-l1", "-r1")
        }

        // Swap left and right triggers if necessary (without changing keycodes)
        if(sc.options.get("gamepad-swap-triggers")) {
            throwBtn = throwBtn.replace("-r2", "-l2")
            specialBtn = specialBtn.replace("-r2", "-l2")
            dashBtn = dashBtn.replace("-l2", "-r2")
            quickBtn = quickBtn.replace("-l2", "-r2")
        }

        // The guard button is the same as the dash button, set it after all the above has been handled
        var guardBtn = dashBtn;

        // Update the default action map to use the buttons from above
        actionMap["throw"] = throwBtn;
        actionMap["special"] = specialBtn;
        actionMap["dash"] = dashBtn;
        actionMap["guard"] = guardBtn;
        actionMap["quick"] = quickBtn;

        // Set the actual keycodes for the attack and dash actions depending on whether or not they are swapped
        // These new keycodes will be used by the _getButton functions in sc.Control
        ig.ATTACKTRIGGER = sc.options.get("gamepad-swap-triggers") ? ig.BUTTONS.LEFT_TRIGGER : ig.BUTTONS.RIGHT_TRIGGER;
        ig.ATTACKBUMPER = sc.options.get("gamepad-swap-bumpers") ? ig.BUTTONS.LEFT_SHOULDER : ig.BUTTONS.RIGHT_SHOULDER;
        ig.DASHTRIGGER = sc.options.get("gamepad-swap-triggers") ? ig.BUTTONS.RIGHT_TRIGGER : ig.BUTTONS.LEFT_TRIGGER;
        ig.DASHBUMPER = sc.options.get("gamepad-swap-bumpers") ? ig.BUTTONS.RIGHT_SHOULDER : ig.BUTTONS.LEFT_SHOULDER;

        // Swap the keycodes for A and B if necessary, but run it in a separate async function
        // This allows the function to sleep for 350 milliseconds.
        // Without this sleep, checking the Swap A/B button would immediately exit the menu, since the game thinks you just pressed the exit button
        swapAB();

        // Swap the keycodes for X and Y if the setting is checked
        if(sc.options.get("gamepad-swap-xy")) {
            ig.BUTTONS.FACE2 = 3;
            ig.BUTTONS.FACE3 = 2;
        } else {
            ig.BUTTONS.FACE2 = 2;
            ig.BUTTONS.FACE3 = 3;
        }

        return actionMap;
    },
    updateGamepadIcons: function() {
        // Most of the logic that was in this function was moved to generateActionMap()
        // This now passes the new action map to changeGamepadIcon
        sc.fontsystem.setGamepadIconStyle(sc.options.get("gamepad-icons"));
        sc.fontsystem.changeGamepadIcon(this.generateActionMap());
    }
});

// Modify FontSystem to support more than two button styles
// It is necessary to re-implement the offsets for all the different styles here,
// since injected functions do not have access to the internal shared variables
// that normally store them.
sc.FontSystem.inject({
    getKeyboardOffsets: function() {
        return {
            left: [1, 0],
            down: [1, 1],
            right: [1, 2],
            up: [1, 3],
            aim: [1, 5],
            "throw": [1, 5],
            dash: [1, 6],
            guard: [1, 6],
            pause: [1, 7],
            back: [1, 4],
            special: [1, 16],
            select: [0, 0],
            help: [1, 14],
            help2: [1, 13],
            help3: [1, 17],
            help4: [1, 19],
            menu: [1, 9],
            quick: [1, 44],
            cold: [1, 56],
            shock: [1, 57],
            heat: [1, 58],
            wave: [1, 59],
            "arrow-left": [0, 5],
            "arrow-right": [0, 6],
            "arrow-left-off": [0, 65],
            "arrow-right-off": [0, 66],
            "circle-left": [1, 11],
            "circle-right": [1, 12],
            "list-up": [1, 0],
            "list-down": [1, 2],
            "page-left": [1, 0],
            "page-right": [1, 2],
            "skip-cutscene": [1, 19]
        };
    },
    getXboxOffsets: function() {
        return {
            "left-stick": [2, 0],
            "right-stick": [2, 1],
            "gamepad-l1": [2, 2],
            "gamepad-r1": [2, 3],
            "gamepad-l2": [2, 4],
            "gamepad-r2": [2, 5],
            "gamepad-select": [2, 6],
            "gamepad-pause": [2, 7],
            "gamepad-left": [2, 8],
            "gamepad-down": [2, 9],
            "gamepad-right": [2, 10],
            "gamepad-up": [2, 11],
            "gamepad-a": [2, 12],
            "gamepad-b": [2, 13],
            "gamepad-x": [2, 14],
            "gamepad-y": [2, 15],
            "left-stick-left": [2, 16],
            "left-stick-right": [2, 17],
            "left-stick-press": [2, 18],
            "right-stick-press": [2, 19],
            "gamepad-l1-off": [2, 20],
            "gamepad-r1-off": [2, 21]
        };
    },
    getPs4Offsets: function() {
        return {
            "left-stick": [2, 22],
            "right-stick": [2, 23],
            "gamepad-l1": [2, 24],
            "gamepad-r1": [2, 25],
            "gamepad-l2": [2, 26],
            "gamepad-r2": [2, 27],
            "gamepad-select": [2, 28],
            "gamepad-pause": [2, 29],
            "gamepad-left": [2, 30],
            "gamepad-down": [2, 31],
            "gamepad-right": [2, 32],
            "gamepad-up": [2, 33],
            "gamepad-a": [2, 34],
            "gamepad-b": [2, 35],
            "gamepad-x": [2, 36],
            "gamepad-y": [2, 37],
            "left-stick-left": [2, 38],
            "left-stick-right": [2, 39],
            "left-stick-press": [2, 40],
            "right-stick-press": [2, 41],
            "gamepad-l1-off": [2, 42],
            "gamepad-r1-off": [2, 43]
        };
    },
    getSwitchOffsets: function() {
        // Return different offsets for the Switch Gamepad icons depending on the theme the user has chosen.
        if(sc.options.get("gamepad-switch-icon-theme") == 3) {
            return {
                "left-stick":[2, 111],
                "right-stick":[2, 112],
                "gamepad-l1":[2, 113],
                "gamepad-r1":[2, 114],
                "gamepad-l2":[2, 115],
                "gamepad-r2":[2, 116],
                "gamepad-select":[2, 117],
                "gamepad-pause":[2, 118],
                "gamepad-left":[2, 119],
                "gamepad-down":[2, 120],
                "gamepad-right":[2, 121],
                "gamepad-up":[2, 122],
                "gamepad-a":[2, 123],
                "gamepad-b":[2, 124],
                "gamepad-x":[2, 125],
                "gamepad-y":[2, 126],
                "left-stick-left":[2, 127],
                "left-stick-right":[2, 128],
                "left-stick-press":[2, 129],
                "right-stick-press":[2, 130],
                "gamepad-l1-off":[2, 131],
                "gamepad-r1-off":[2, 132]
            };
        } else if(sc.options.get("gamepad-switch-icon-theme") == 2) {
            return {
                "left-stick":[2, 89],
                "right-stick":[2, 90],
                "gamepad-l1":[2, 91],
                "gamepad-r1":[2, 92],
                "gamepad-l2":[2, 93],
                "gamepad-r2":[2, 94],
                "gamepad-select":[2, 95],
                "gamepad-pause":[2, 96],
                "gamepad-left":[2, 97],
                "gamepad-down":[2, 98],
                "gamepad-right":[2, 99],
                "gamepad-up":[2, 100],
                "gamepad-a":[2, 101],
                "gamepad-b":[2, 102],
                "gamepad-x":[2, 103],
                "gamepad-y":[2, 104],
                "left-stick-left":[2, 105],
                "left-stick-right":[2, 106],
                "left-stick-press":[2, 107],
                "right-stick-press":[2, 108],
                "gamepad-l1-off":[2, 109],
                "gamepad-r1-off":[2, 110]
            };
        } else if(sc.options.get("gamepad-switch-icon-theme") == 1) {
            return {
                "left-stick":[2, 67],
                "right-stick":[2, 68],
                "gamepad-l1":[2, 69],
                "gamepad-r1":[2, 70],
                "gamepad-l2":[2, 71],
                "gamepad-r2":[2, 72],
                "gamepad-select":[2, 73],
                "gamepad-pause":[2, 74],
                "gamepad-left":[2, 75],
                "gamepad-down":[2, 76],
                "gamepad-right":[2, 77],
                "gamepad-up":[2, 78],
                "gamepad-a":[2, 79],
                "gamepad-b":[2, 80],
                "gamepad-x":[2, 81],
                "gamepad-y":[2, 82],
                "left-stick-left":[2, 83],
                "left-stick-right":[2, 84],
                "left-stick-press":[2, 85],
                "right-stick-press":[2, 86],
                "gamepad-l1-off":[2, 87],
                "gamepad-r1-off":[2, 88]
            };
        } else {
            return {
                "left-stick":[2, 45],
                "right-stick":[2, 46],
                "gamepad-l1":[2, 47],
                "gamepad-r1":[2, 48],
                "gamepad-l2":[2, 49],
                "gamepad-r2":[2, 50],
                "gamepad-select":[2, 51],
                "gamepad-pause":[2, 52],
                "gamepad-left":[2, 53],
                "gamepad-down":[2, 54],
                "gamepad-right":[2, 55],
                "gamepad-up":[2, 56],
                "gamepad-a":[2, 57],
                "gamepad-b":[2, 58],
                "gamepad-x":[2, 59],
                "gamepad-y":[2, 60],
                "left-stick-left":[2, 61],
                "left-stick-right":[2, 62],
                "left-stick-press":[2, 63],
                "right-stick-press":[2, 64],
                "gamepad-l1-off":[2, 65],
                "gamepad-r1-off":[2, 66]
            };
        }
    },
    // Determine which style from the above defined offsets to use
    // Also swap the sprites of A/B and X/Y if necessary
    getSelectedStyle: function() {
        // Each style map is in order based on its order in the menu
        // this.gamepadIconStyle will return the index of the user's selected style
        var styles = [
            this.getXboxOffsets(),
            this.getPs4Offsets(),
            this.getSwitchOffsets()
        ];

        var selectedStyle = styles[this.gamepadIconStyle];

        // If A and B is swapped, since we have to swap the UI for them too, we have to swap their sprite offsets directly
        if(sc.options.get("gamepad-swap-ab")) {
            var spriteA = selectedStyle["gamepad-a"];
            var spriteB = selectedStyle["gamepad-b"];
            selectedStyle["gamepad-a"] = spriteB;
            selectedStyle["gamepad-b"] = spriteA;
        }

        // If X and Y is swapped, since we have to swap the UI for them too, we have to swap their sprite offsets directly
        if(sc.options.get("gamepad-swap-xy")) {
            var spriteX = selectedStyle["gamepad-x"];
            var spriteY = selectedStyle["gamepad-y"];
            selectedStyle["gamepad-x"] = spriteY;
            selectedStyle["gamepad-y"] = spriteX;
        }

        return selectedStyle;
    },
    // Generate a list of offsets, turning an actionMap into a list of offsets based on the selected gamepad style
    generateOffsetMap: function(actionMap) {
        var offsetMap = {};
        var style = this.getSelectedStyle();
        for (var action in actionMap) {
            offsetMap[action] = style[actionMap[action]];
        }
        return offsetMap;
    },
    // Update changeGamepadIcon to instead update mappings based on a passed in actionMap
    changeGamepadIcon: function(actionMap) {
        // Get the default offsets for the selected style
        var selectedStyle = this.getSelectedStyle();

        // Based on whether or not Swap L/R is checked, swap the icons shown for l1/r1 in the Gamepad tab under Attack / Charge and Dash / Quick Menu
        if(sc.options.get("gamepad-swap-bumpers")){
            // Swapped
            selectedStyle["gamepad-hh"] = selectedStyle["gamepad-r1"];
            selectedStyle["gamepad-jj"] = selectedStyle["gamepad-l1"];
        } else {
            // Defaults
            selectedStyle["gamepad-hh"] = selectedStyle["gamepad-l1"];
            selectedStyle["gamepad-jj"] = selectedStyle["gamepad-r1"];
        }

        // Based on whether or not Swap LT/RT is checked, swap the icons shown for l2/r2 in the Gamepad tab under Attack / Charge and Dash / Quick Menu
        if(sc.options.get("gamepad-swap-triggers")) {
            // Swapped
            selectedStyle["gamepad-ii"] = selectedStyle["gamepad-r2"];
            selectedStyle["gamepad-kk"] = selectedStyle["gamepad-l2"];
        } else {
            // Defaults
            selectedStyle["gamepad-ii"] = selectedStyle["gamepad-l2"];
            selectedStyle["gamepad-kk"] = selectedStyle["gamepad-r2"];
        }

        // Call fontsystem.font.setMapping twice; once to give it the sprite offsets with gamepad buttons as keys,
        // and another to give it sprite offsets with game actions as keys (but only if the gamepad icons are active, because that's how the vanilla game does it)
        this.font.setMapping(selectedStyle);
        if (this.gamepadIcons) {
            this.font.setMapping(this.generateOffsetMap(actionMap));
        }
    },
    // Make setGamepadIconStyle call changeGamepadIcon() instead of updateGamepadSwapMap(), since the functionality of the latter was moved to the former
    setGamepadIconStyle: function(styleIndex){
        this.gamepadIconStyle = styleIndex;
        this.changeGamepadIcon(sc.options.keyBinder.generateActionMap());
    },
    // Override onVarsChanged to properly switch between the gamepad icons and the keyboard icons
    onVarsChanged: function() {
        var actionMap = sc.options.keyBinder.generateActionMap();
        var useGamepadIcons = ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD;
        this.gamepadIcons = useGamepadIcons;
        if(this.gamepadIcons) {
            this.font.setMapping(this.generateOffsetMap(actionMap));
        } else {
            this.font.setMapping(this.getKeyboardOffsets());
        }
    }
});

// Update sc.Control to support swappable L/R and LT/RT
// The new keycodes are initialized in KeyBinder whenever the buttons are swapped
sc.Control.inject({
    _getAttackButton: function() {
        return sc.options.get("gamepad-attack") ? ig.ATTACKTRIGGER : ig.ATTACKBUMPER;
    },
    _getSpecialButton: function() {
        return sc.options.get("gamepad-attack") ? ig.ATTACKBUMPER : ig.ATTACKTRIGGER;
    },
    _getDashButton: function() {
        return sc.options.get("gamepad-dash") ? ig.DASHTRIGGER : ig.DASHBUMPER;
    },
    _getQuickMenuButton: function() {
        return sc.options.get("gamepad-dash") ? ig.DASHBUMPER : ig.DASHTRIGGER;
    }
});

// A generic sleep function, allows swapAB to work on a delay
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Swap the keycodes for A and B if necessary, but swap them in this separate async function
async function swapAB() {
    // Wait 350 milliseconds before changing the keycodes
    await sleep(350);

    // Swap the keycodes for A and B if the setting is checked
    if(sc.options.get("gamepad-swap-ab")) {
        ig.BUTTONS.FACE0 = 1;
        ig.BUTTONS.FACE1 = 0;
    } else {
        ig.BUTTONS.FACE0 = 0;
        ig.BUTTONS.FACE1 = 1;
    }
}
