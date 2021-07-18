build:
	cd tests \
	&& riscv64-unknown-elf-gcc -Wl,-Ttext=0x0 -nostdlib -o addi.out addi.s \
	&& riscv64-unknown-elf-objcopy -O binary addi.out addi.bin