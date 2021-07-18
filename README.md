## RISC-V emulator written in JS.

Currently implements I-type base format. Goal is to run xv6.

### Example

```shell
$ make
cd tests \
&& riscv64-unknown-elf-gcc -Wl,-Ttext=0x0 -nostdlib -o addi.out addi.s \
&& riscv64-unknown-elf-objcopy -O binary addi.out addi.bin
/usr/lib/riscv64-unknown-elf/bin/ld: warning: cannot find entry symbol _start; defaulting to 0000000000000000
$ deno run --allow-read cpu.js
[dbg] AUIPC
[dbg] ADDI
[dbg] dump
....... ....... ...DRAM ....... 
....... ....... ....... ....... 
....... ....... x10=0x90000111 x11=0x90000112 
....... ....... ....... ....... 
....... ....... ....... ....... 
....... ....... ....... ....... 
....... ....... ....... ....... 
....... ....... ....... .......
```

### Reference

- @d0iasm's amazing rvemu: https://github.com/d0iasm/rvemu
- well written RISC-V specification:
  https://riscv.org/wp-content/uploads/2017/05/riscv-spec-v2.2.pdf

<small> Licensed under MIT license. </small>
