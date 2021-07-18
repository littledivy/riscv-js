const DRAM_SIZE = 1024 * 1024 * 1;
const DRAM_BASE = 0x80000000;
const REGS = 32;
const ABI = [
  "zero",
  "ra",
  "sp",
  "gp",
  "tp",
  "t0",
  "t1",
  "t2",
  "s0",
  "s1",
  "a0",
  "a1",
  "a2",
  "a3",
  "a4",
  "a5",
  "a6",
  "a7",
  "s2",
  "s3",
  "s4",
  "s5",
  "s6",
  "s7",
  "s8",
  "s9",
  "s10",
  "s11",
  "t3",
  "t4",
  "t5",
  "t6",
];

class CPU {
  #regs = new Array(REGS); // x0-x31
  #pc = 0; // program counter
  #mem = new Array(DRAM_SIZE);
  #csr = new Array(4069);

  #debug = true; // TODO: make configurable

  constructor(buffer) {
    // Always zero.
    this.#regs[0] = 0x00;
    this.#regs[2] = DRAM_SIZE + DRAM_BASE;

    this.#pc = DRAM_BASE;
    // The DRAM memory buffer
    this.#mem = buffer;
  }

  dumpRegisters() {
    this.debug("dump");
    for (let i = 0; i < 32; i += 4) {
      let row = "";
      for (let s = 0; s < 4; s++) {
        if (i + s == 2) {
          row += "...DRAM ";
        } else if (!this.#regs[i + s]) {
          row += "....... ";
        } else {
          row += `x${i + s}=0x${this.#regs[i + s].toString(16)} `;
        }
      }
      console.log(row);
    }
  }

  debug(str) {
    if (this.#debug) {
      console.log("[dbg]", str);
    }
  }

  // Fetch a uint32 instruction from DRAM
  fetch() {
    const idx = this.#pc - DRAM_BASE;
    return this.#mem[idx] |
      this.#mem[idx + 1] << 8 |
      this.#mem[idx + 2] << 16 |
      this.#mem[idx + 3] << 24;
  }

  execute(instruction) {
    // Increment program counter
    this.#pc += 4;

    const opcode = instruction & 0x7f;
    const funct3 = (instruction >> 12) & 0x7;
    const rd = (instruction >> 7) & 0x1f;
    const rs1 = (instruction >> 15) & 0x1f;

    switch (opcode) {
      // I-type base instruction format
      // imm[11:0] | rs1 | funct3 | rd  | opcode
      case 0x13: {
        switch (funct3) {
          case 0x0: { // addi
            const imm = (instruction & 0xfff00000) >> 20;
            this.#regs[rd] = this.#regs[rs1] + imm;
            this.debug("ADDI");
            break;
          }
          case 0x1: { // slli
            const imm = (instruction & 0xfff00000) >> 20;
            let shamt = imm & 0x3f;
            this.#regs[rd] = this.#regs[rs1] << shamt;
            this.debug("SLII");
            break;
          }
          case 0x2: // slti
          case 0x3: { // sltiu
            const imm = (instruction & 0xfff00000) >> 20;
            this.#regs[rd] = (this.#regs[rs1] < imm) ? 1 : 0;
            this.debug("SLTI");
            break;
          }
          case 0x4: { // xori
            const imm = (instruction & 0xfff00000) >> 20;
            this.#regs[rd] = this.#regs[rs1] ^ imm;
            this.debug("XORI");
            break;
          }
          case 0x5: {
            throw new TypeError("not implemented");
          }
          case 0x6: { // ori
            const imm = (instruction & 0xfff00000) >> 20;
            this.#regs[rd] = this.#regs[rs1] | imm;
            this.debug("ORI");
            break;
          }
          case 0x7: { // andi
            const imm = (instruction & 0xfff00000) >> 20;
            this.#regs[rd] = this.#regs[rs1] & imm;
            this.debug("ANDI");
            break;
          }
        }
        break;
      }
      // imm[31:12] | rd | 0110111
      case 0x37: { // lui
        this.#regs[rd] = instruction & 0xfffff000;
        this.debug("LUI");
        break;
      }
      // imm[31:12] | rd | 0010111
      case 0x17: { // auipc
        // imm[31:12]
        const immU = instruction & 0xfffff999;
        this.#regs[rd] = (this.#pc + immU) - 4;
        this.debug("AUIPC");
        break;
      }
      // imm[20|10:1|11|19:12] | rd | 1101111
      case 0x6f: { // jal
        const immJ = (instruction & 0x80000000) >> 11 |
          (instruction & 0xff000) |
          ((instruction >> 9) & 0x800) | ((instruction >> 20) & 0x7fe);
        this.#regs[rd] = this.#pc;
        this.#pc += immJ - 4;
        this.debug("JAL");
      }
      // imm[11:0] | rs1 | 000 | rd | 1100111
      case 0x67: { // jalr
        const imm = (instruction && 0xfff00000) >> 20;
        const tpc = this.#pc;
        this.#pc = this.#regs[rs1] + imm & 0xfffffffe;
        this.#regs[rd] = tpc;
        this.debug("JALR");
      }
    }
  }
}

const bin = await Deno.readFile("tests/addi.bin");
const cpu = new CPU(bin);

for (let addr of bin) {
  const inst = cpu.fetch(addr);
  cpu.execute(inst);
}

cpu.dumpRegisters();
