# Bot Flow Builder

Vẽ kịch bản chatbot bằng cách kéo thả node, bấm Build để xuất ra JSON.

## Chạy thử

Cần Node `^20.19.0` hoặc `>=22.12.0` (yêu cầu của Vite 8). Node cũ hơn sẽ cài lỗi.

```bash
npm install
npm run dev
```

## Cách dùng

1. Kéo node từ cột trái vào canvas.
2. Nối node bằng cách kéo từ chấm dưới sang chấm trên của node kế tiếp.
3. Chọn node để sửa nội dung ở cột phải.
4. Bấm **Build** — nếu kịch bản hợp lệ sẽ hiện JSON, nếu không sẽ hiện danh sách lỗi (bấm vào lỗi để nhảy tới node sai).

## 5 loại node

| Node | Vai trò |
|---|---|
| Start | Điểm bắt đầu |
| Message | Bot nói một câu |
| Ask | Hỏi người dùng, lưu câu trả lời vào biến |
| Condition | Rẽ nhánh true/false |
| End | Kết thúc |

## JSON xuất ra

```json
{
  "version": 1,
  "start": "n1",
  "nodes": {
    "n1": { "type": "start", "next": "n2" },
    "n2": { "type": "message", "text": "Xin chào!", "next": "n3" },
    "n3": { "type": "end" }
  }
}
```

Toạ độ node bị bỏ đi khi build — JSON này mô tả kịch bản để chạy bot, không phải để vẽ lại sơ đồ.

## Test

```bash
npm test
```

Test phủ `src/build/` — phần compile và validate.

## Stack

Vite · React · TypeScript · Tailwind CSS · React Flow · Vitest
