const height = 800;
const width = 900;
const onColor = "#ff0000";
const offColor = "#660000";
const canvas = document.getElementById("canvas");
canvas.height = height;
canvas.width = width;
const ctx = canvas.getContext("2d");

let isEditMode = false;

let speed = 1; //Hz
let counter = 0;
let instruction = 0;
let instructionSetBit = 0;
let accumulator = 0;
let instructions = [];

const instructionsDict = {
  STOP: 0b00000000, //0
  RIGHT: 0b00000001, //1
  LEFT: 0b00000010, //2
  NOT: 0b00001111, //15
  AND: 0b00010001, //17
  OR: 0b00010010, //18
  XOR: 0b00010011, //19
  LOAD: 0b00010100, //20
  STORE: 0b00010101, //21
  ADD: 0b00010110, //22
  SUB: 0b00010111, //23
  GOTO: 0b00011000, //24
  IFZERO: 0b00011001, //25
  NOP: 0b10000000, //128
};
const {
  STOP,
  RIGHT,
  LEFT,
  NOT,
  AND,
  OR,
  XOR,
  LOAD,
  STORE,
  ADD,
  SUB,
  GOTO,
  IFZERO,
  NOP,
} = { ...instructionsDict };
const instructionNames = {};
Object.keys(instructionsDict).map(
  (k) => (instructionNames[instructionsDict[k]] = k)
);

const flashLights = [
  LOAD,
  7,
  LOAD,
  8,
  LOAD,
  9,
  STOP,
  0b00001111,
  0b11110000,
  0b11111111,
];

const flashLights1 = [LOAD, 7, NOT, OR, 7, NOP, STOP, 0b00001111];

const moveLight = [LOAD, 8, RIGHT, IFZERO, 7, GOTO, 2, STOP, 0b10000000];

const countDown = [
  LOAD,
  9,
  SUB,
  10,
  IFZERO,
  8,
  GOTO,
  2,
  STOP,
  0b00001111,
  0b00000001,
];

const add = [LOAD, 7, ADD, 8, STORE, 9, STOP, 1, 2, 0];

const compare = [LOAD, 9, XOR, 10, IFZERO, 8, LOAD, 11, STOP, 5, 1, 0b11111111];
const test = [XOR, 10, IFZERO, 8, LOAD, 11, STOP];

instructions = flashLights;

ctx.fillStyle = offColor;

const disassemble = (instructions) => {
  const output = [];
  let isStop = false;
  const getName = (ins) =>
    `0x${ins.toString(16).toUpperCase().padStart(2, "0")}`;
  for (let i = 0; i < instructions.length; i++) {
    const instruction = instructions[i];
    const name = isStop ? getName(instruction) : instructionNames[instruction];
    switch (instruction) {
      case RIGHT:
      case LEFT:
      case AND:
      case OR:
      case XOR:
      case LOAD:
      case ADD:
      case SUB:
      case GOTO:
      case IFZERO:
        const operand = instructions[++i];
        output.push(`${name} ${operand}`);
        break;
      case STOP:
      case NOT:
      case NOP:
        if (instruction === STOP) {
          isStop = true;
        }
        output.push(name);
        break;
      default:
        output.push(`0x${instruction.toString(16).toUpperCase()}`);
        break;
    }
    output.push("\n");
  }
  return output.join("");
};
const assemble = () => {
  const codeString = code.value;
  const lines = codeString.split("\n");
  const commands = [];
  const labels = {};
  lines.forEach((line, index) => {
    const bytes = line.split(" ");
    bytes.forEach((byte) => {
      if(bytes.startsWith(":")) {
        labels[bytes.slice(1)] = index;
      } else {
        commands.push(instructionsDict[byte] ?? parseInt(byte));
      }
    });
  });
  instructions = commands;
  console.log(instructions);
};
const assembleAndRun = async () => {
  assemble();
  await run();
};
const code = document.querySelector("#code");
code.value = disassemble(instructions);

const drawCircle = (x, y, radius, start = 0, end = 2 * Math.PI) => {
  ctx.beginPath();
  ctx.arc(x, y, radius, start, end);
  ctx.fill();
};

const drawArray = (x, y, item) => {
  for (let i = 0; i < 8; i++) {
    let isOn = (item >> i) & (1 === 1);
    ctx.fillStyle = isOn ? onColor : offColor;
    drawCircle(x - i * 50, y, 20);
  }
};

const getValue = (address) => {
  const location = instructions[address];
  const value = instructions[location];
  return value;
};

const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const delay = async () => {
  update();
  await sleep((1 / speed) * 1000);
  instruction = instructions[counter];
};

const step = () => {
  switch (instruction) {
    case LOAD:
      accumulator = getValue(++counter); //get address and then get value at address
      break;
    case STORE:
      instructions[getValue(++counter)] = accumulator;
      break;
    case NOT:
      accumulator = ~accumulator & 0b11111111;
      break;
    case OR:
      accumulator |= getValue(++counter);
      break;
    case AND:
      accumulator &= getValue(++counter);
      break;
    case XOR:
      accumulator ^= getValue(++counter);
      break;
    case RIGHT:
      accumulator = accumulator >> 1;
      break;
    case LEFT:
      accumulator = accumulator << 1;
      break;
    case IFZERO:
      if (accumulator === 0) {
        counter = instructions[++counter]; //will be counter + 1 at end
        return true;
      }
      break;
    case GOTO:
      counter = instructions[++counter];
      return true;
    case SUB:
      accumulator -= getValue(++counter);
      break;
    case ADD:
      accumulator += getValue(++counter);
      break;
    case NOP:
      break;
  }
};

const stepOnce = async () => {
  const skip = step();
  if (skip) {
    return;
  }
  counter++;
  instruction = instructions[counter];
  update();
};

const reset = () => {
  counter = 0;
  accumulator = 0;
  instruction = instructions[counter];
  update();
};

const run = async () => {
  reset();
  while (instruction != STOP) {
    await stepOnce();
    await delay();
  }
};
document.querySelector("#run").onclick = run;
document.querySelector("#reset").onclick = reset;
document.querySelector("#step").onclick = stepOnce;
document.querySelector("#disassemble").onclick = disassemble;
document.querySelector("#assemble").onclick = assemble;
document.querySelector("#assembleAndRun").onclick = assembleAndRun;

const download = function () {
  const link = document.createElement("a");
  link.download = "toy_cpu_binary.tc";
  const blob = new Blob([instructions], { type: "application/octet-stream" });
  const data = URL.createObjectURL(blob);
  link.href = data;
  link.click();
  URL.revokeObjectURL(link.href);
};
document.querySelector("#download").onclick = download;

const fileInput = document.getElementById("upload");
fileInput.onchange = (e) => {
  const selectedFile = e.srcElement.files[0];
  const reader = new FileReader();
  console.log(selectedFile, reader);
  reader.onload = (e) => {
    const buffer = e.target.result;
    const view = new Uint8Array(buffer);
    instructions = view;
    code.value = disassemble(instructions);
  };
  reader.readAsArrayBuffer(selectedFile);
};

const speedInput = document.querySelector("#speed");
speedInput.value = speed;
speedInput.onchange = (e) => (speed = parseInt(e.target.value));

const programsDict = {
  flashLights: flashLights,
  flashLights1: flashLights1,
  moveLight: moveLight,
  countDown: countDown,
  add: add,
  compare: compare,
};
const select = document.querySelector("#choice");
Object.keys(programsDict).map((k) => {
  const option = document.createElement("option");
  (option.value = k), (option.innerText = k);
  select.appendChild(option);
});
select.onchange = (e) => {
  instructions = programsDict[e.target.value];
  code.value = disassemble(instructions);
  reset();
};

/**
 *
 * @param {number} endX
 * @param {number} y
 */
const drawInstruction = (endX, y) => {
  for (let i = 0; i < 8; i++) {
    let isOn = (instructions[counter] >> i) & (1 === 1);
    ctx.fillStyle = isOn ? onColor : offColor;
    drawCircle(endX - i * 50, y, 20);
    if (instructionSetBit === i && isEditMode) {
      ctx.fillStyle = offColor;
      ctx.fillRect(endX - i * 50 - 10, y + 25, 20, 5);
    }
  }
};

const update = () => {
  let startX = 30;
  let startY = 100;
  let spacing = 40;
  const isDesktop = false;
  if(isDesktop) {
    startX = 480;
    startY = 25;
    spacing = 50;
  }
  ctx.clearRect(0, 0, width, height);
  const x = 5;
  const y = height - 105;
  ctx.beginPath();
  ctx.font = "23px Arial";
  ctx.fillText("Mode: " + (isEditMode ? "Edit" : "Input"), x, y + 100);

  ctx.fillText("Counter: " + counter, 30, 25);
  drawArray(400, 55, counter);

  ctx.fillStyle = offColor; 
  ctx.fillText("Instruction", startX, startY);
  startY += spacing;
  drawInstruction(startX + 370, startY);

  ctx.fillStyle = offColor;
  startY += spacing;
  ctx.fillText(
    `Accumulator: 0x${accumulator
      .toString(16)
      .toUpperCase()
      .padStart(2, "0")} ${accumulator}`,
    startX,
    startY
  );
  startY += spacing;
  drawArray(startX + 370, startY, accumulator);

  ctx.fillStyle = offColor;
  startY += spacing;
  ctx.fillText("INI  HLT ERR ABT RUN EDT INP PWR", startX, startY);
  startY += spacing;
  drawArray(startX + 370, startY);

  ctx.font = "16px Arial";
  ctx.fillText("_ _ _ _ _ _ _ _ STOP", 10, 300);
  ctx.fillText("_ _ _ _ _ _ _ o RIGHT", 10, 320);
  ctx.fillText("_ _ _ _ _ _ o _ LEFT", 10, 340);
  ctx.fillText("_ _ _ _ o o o o NOT", 10, 360);
  ctx.fillText("_ _ _ o _ _ _ o AND addr", 10, 380);
  ctx.fillText("_ _ _ o _ _ o _ OR addr", 10, 400);
  ctx.fillText("_ _ _ o _ _ o o XOR addr", 10, 420);
  ctx.fillText("_ _ _ o _ o _ _ LOAD addr", 10, 440);
  ctx.fillText("_ _ _ o _ o _ o STORE addr", 10, 460);
  ctx.fillText("_ _ _ o _ o o _ ADD addr", 10, 480);
  ctx.fillText("_ _ _ o _ o o o SUB addr", 10, 500);
  ctx.fillText("_ _ _ o o _ _ _ GOTO addr", 10, 520);
  ctx.fillText("_ _ _ o o _ _ o IFZERO addr", 10, 540);
  ctx.fillText("o _ _ _ _ _ _ _ NOP", 10, 560);
};

update();

document.addEventListener("keydown", (e) => {
  if (isEditMode) {
    if (e.key === "ArrowLeft") {
      //left
      instructionSetBit += 1;
      instructionSetBit %= 8;
      update();
    } else if (e.key === "ArrowRight") {
      //right
      if (instructionSetBit > 0) {
        instructionSetBit -= 1;
      } else {
        instructionSetBit = 7;
      }
      update();
    } else if (e.key === " ") {
      //space
      e.preventDefault();
      const currentBit =
        (instructions[counter] >> instructionSetBit) & (1 === 1);
      instructions[counter] = instructions[counter] ^ (1 << instructionSetBit);
      update();
    } else if (e.key === "Enter") {
      //enter
      isEditMode = false;
      update();
    }
  } else {
    if (e.key === "ArrowUp") {
      //up
      e.preventDefault();
      if (counter > 0) {
        counter -= 1;
      } else {
        counter = 255;
      }
      update();
    } else if (e.key === "ArrowDown") {
      //down
      e.preventDefault();
      counter += 1;
      counter %= 256;
      update();
    } else if (e.key === "Enter") {
      //enter
      isEditMode = true;
      update();
    } else if (e.key === "r") {
      //r
      run();
    }
  }
});
