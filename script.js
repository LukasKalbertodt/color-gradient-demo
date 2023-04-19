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
    const numValues = Math.pow(2, bits);

    const hex = v => v.toString(16).padStart(2, "0");
    const pureColor = v => {
        switch (color) {
            case "red": return `#${hex(v)}0000`;
            case "green": return `#00${hex(v)}00`;
            case "blue": return `#0000${hex(v)}`;
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
            for (let x = 0; x < canvas.width; x++) {
                const v = Math.floor(numValues * (x / canvas.width));
                const normalized = v * (256 / numValues);
                ctx.fillStyle = pureColor(normalized);
                ctx.fillRect(x, 0, 1, canvas.height);
            }

            break;

        case "mix":
            const LUMINANCE = {
                red: 0.2126,
                green: 0.7152,
                blue: 0.0722,
            };

            const linearize = srgb => srgb <= 0.04045
                ? srgb / 12.92
                : Math.pow((( srgb + 0.055)/1.055),2.4);

            let usedOtherColors = 0;
            for (let x = 0; x < canvas.width; x++) {
                // Calculate exact color value in `bits` many bits.
                const exact = numValues * (x / canvas.width);
                const v = Math.floor(exact);

                const achievedLuminance = linearize(v / numValues) * LUMINANCE[color];
                const idealLuminance = linearize(exact / numValues) * LUMINANCE[color];
                const lumDiff = idealLuminance - achievedLuminance;

                let a0 = 0;
                let a1 = 0;
                const improved = () => {
                    const l0 = linearize(a0 / numValues);
                    const l1 = linearize(a1 / numValues);
                    switch (color) {
                        case "red": return l0 * LUMINANCE.green + l1 * LUMINANCE.blue;
                        case "green": return l0 * LUMINANCE.red + l1 * LUMINANCE.blue;
                        case "blue": return l0 * LUMINANCE.red + l1 * LUMINANCE.green;
                    }
                };
                while (lumDiff > improved()) {
                    if (a0 == a1) {
                        a0 += 1;
                    } else {
                        a1 += 1;
                    }
                }

                // // 0.05 lumDiff
                // // others = 0.05 / (1 - 0.715) = 0.05 / 0.285 = 0.17
                // // So each should contribute 0.17 / 2 = 0.085
                // // 0.08 / 0.285 = 0.28
                // const lumOthersPerStep = (1 - LUMINANCE[color]) / numValues;
                // const others = lumDiff / lumOthersPerStep;
                // // const stretched = numValues * others;

                // // red per value: 0.02625
                // // blue per value: 0.00875
                // // together per value: 0.035
                // // * 8 => 0.28
                // // 0.08 lum diff
                // // 2 * r = 0.07875 + 3 * b = 0.02625
                // // 3 * r = 0.07875 + 3 * b = 0.02625
                // const a0 = Math.round(others);
                // const a1 = Math.round(2 * others - a0);

                // console.log(`${achievedLuminance} .. ${idealLuminance}`);

                // const diff = (linearize(exact / numValues) - linearize(v / numValues)) * numValues;
                // const lumDiff = diff * LUMINANCE[color];

                // We now know how much luminance we are missing. Now we add a
                // bit of other color to make up for it. We want to have
                // roughly equal amounts of both other colors.
                // const ideal = 4 * lumDiff / (1 - LUMINANCE[color]);
                // const a0 = Math.round(ideal / 2);
                // const a1 = Math.round(ideal - a0);

                if (a0 > 0 || a1 > 0) {
                    usedOtherColors++;
                }

                // Multiply it to get normal 8bit color values.
                const [main, add0, add1] = [v, a0, a1]
                    .map(s => s * (256 / numValues));

                ctx.fillStyle = (() => {
                    switch (color) {
                        case "red": return `#${hex(main)}${hex(add0)}${hex(add1)}`;
                        case "green": return `#${hex(add0)}${hex(main)}${hex(add1)}`;
                        case "blue": return `#${hex(add0)}${hex(add1)}${hex(main)}`;
                    }
                })();
                // if (x % 50 == 0) {
                //     const lum = linearize(main / 255) * LUMINANCE[color]
                //         + linearize(add0 / 255) * LUMINANCE["red"]
                //         + linearize(add1 / 255) * LUMINANCE["blue"];
                //     console.log(`${lumDiff} => ${a0} ${a1} => ${ctx.fillStyle} :: ${lum}`);
                // }
                ctx.fillRect(x, 0, 1, canvas.height);
            }
            // console.log(usedOtherColors);

            break;

        default:
            console.error("Bad mode");
    }
};



addEventListener("DOMContentLoaded", main);
