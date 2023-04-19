let canvas;
let mode;
let color;
let bits = 8;

const main = () => {
    canvas = document.getElementById("canvas");
    addEventListener("resize", () => {
        updateSize();
        redraw();
    });
    const radios = document.querySelectorAll("input[type='radio']");
    for (const radio of radios) {
        radio.addEventListener("change", () => {
            getInput();
            redraw();
        });
    }


    getInput();
    updateSize();
    redraw();
};

const getInput = () => {
    mode = document.querySelector("input[name='mode']:checked").value;
    color = document.querySelector("input[name='color']:checked").value;
    bits = Number(document.querySelector("input[name='bits']:checked").value);
};

const updateSize = () => {
    canvas.width = window.devicePixelRatio * canvas.scrollWidth;
    canvas.height = window.devicePixelRatio * canvas.scrollHeight;
    console.log(`Updated canvas size to ${canvas.width}x${canvas.height}`);
};

const redraw = () => {
    const ctx = canvas.getContext("2d");

    const pureColor = v => {
        const hex = v.toString(16).padStart(2, "0");
        switch (color) {
            case "red": return `#${hex}0000`;
            case "green": return `#00${hex}00`;
            case "blue": return `#0000${hex}`;
        }
    }

    switch (mode) {
        case "native":
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
            gradient.addColorStop(0, "black");
            gradient.addColorStop(1, pureColor(255));
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            break;

        case "manual":
            const numValues = Math.pow(2, bits);
            for (let x = 0; x < canvas.width; x++) {
                const v = Math.round(numValues * (x / canvas.width));
                const normalized = v * (256 / numValues);
                ctx.fillStyle = pureColor(normalized);
                ctx.fillRect(x, 0, 1, canvas.height);
            }

            break;

        case "dither":
            console.error("not implemented");
            break;

        default:
            console.error("Bad mode");
    }
};



addEventListener("DOMContentLoaded", main);
