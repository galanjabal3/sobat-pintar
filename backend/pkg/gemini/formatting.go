package gemini

func textFormattingInstruction() string {
	return `Gunakan format penekanan teks berikut jika dibutuhkan:
- *teks* untuk cetak miring
- **teks** untuk cetak tebal
- ++teks++ untuk garis bawah
- ==teks== untuk highlight
- ~~teks~~ untuk coret
Jangan gunakan tag HTML.`
}
