# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Dự án

App một trang để vẽ kịch bản chatbot bằng cách kéo thả node lên canvas React Flow rồi nối
chúng lại. Nút Build kiểm tra đồ thị và biên dịch ra JSON mô tả con bot. Năm loại node:
start, message, ask, condition, end. Tác giả đang học React/Tailwind, nên code dễ đọc quan
trọng ngang code chạy được.

## Lệnh

```bash
npm run dev          # dev server
npm test             # chạy toàn bộ vitest
npm run lint         # eslint, có rule react-hooks
npm run format       # prettier --write
npm run format:check # prettier --check (cái CI chạy)
npm run build        # tsc -b && vite build

# Chạy một file test lẻ:
npx vitest run src/build/validate.test.ts
# Chạy một test theo tên:
npx vitest run -t "rejects a condition missing its false branch"
```

CI (`.github/workflows/ci.yml`) chạy lint, format check, typecheck, test, build, và một
bước guard báo lỗi nếu file nào trong `src` vượt 200 dòng.

## Kiến trúc

Ranh giới quan trọng nhất, phải đọc nhiều file mới thấy: **toàn bộ logic thật nằm trong
`src/build/`, và thư mục đó không dính React.**

```
src/
  build/        validate.ts (đồ thị → danh sách lỗi) + compile.ts (đồ thị → JSON).
                Hàm thuần, chỉ import type từ @xyflow/react. Đây là nơi duy nhất được test.
  components/base/  base component tái dùng, không logic: BaseButton, BaseInput, BaseTextarea
  nodes/        năm node component + registry (index.ts) + accents.ts
  panels/       NodePalette, Inspector, BuildPanel — ba cột giao diện
  hooks/        useBotFlow.ts — custom hook giữ state đồ thị và mọi hành động lên nó
  run/          evaluate.ts + interpreter.ts (hàm thuần, chạy Script) + RunModal.tsx (UI chat)
  App.tsx       chỉ dựng layout ba cột; gọi useBotFlow
  types.ts      union BotNode, LABELS, và hằng BRANCH
  sample.ts     flow mẫu cho nút "Ví dụ"
```

- **JSON biên dịch ra không phải bản sao state React Flow.** `compile.ts` làm phẳng edge
  vào trong node (`next`, hoặc `onTrue`/`onFalse` cho condition) và vứt toạ độ x/y đi, để
  bên chạy bot duyệt thẳng được: đọc `start`, làm việc của node, nhảy tới `next`, lặp lại.
- **`validate.ts` gồm 6 luật**, mỗi luật một hàm nhỏ; đồ thị phải qua hết mới được compile.
- **`nodes/index.ts` là registry.** Thêm loại node thứ sáu = viết component + thêm một dòng.
- **Runtime (`src/run/`) là chỗ DUY NHẤT được đánh giá `expression`**; builder vẫn coi nó là
  chuỗi mờ. `interpreter.ts` là step-machine thuần: `createRun` chạy tới ask/end, `advance`
  chạy tiếp. `evaluate.ts` là mini-evaluator (so sánh đơn + `&&`/`||`, không eval).

## Ràng buộc (không phá nếu chưa bàn)

- `src/build/**` không bao giờ import giá trị **runtime** từ `react` hay `@xyflow/react`.
  Import kiểu và import `types.ts` của mình thì được. Ranh giới này là thứ giúp test được
  logic bằng hàm thuần.
- `expression` trên node condition là chuỗi mờ — không bao giờ parse hay đánh giá.
- Không lưu trữ: không localStorage, không backend, không download. Reload là trắng canvas.
- Text người dùng thấy viết tiếng Việt; code, identifier, comment viết tiếng Anh.
- Test phủ **hàm thuần** (`build/`, `sample.ts`), không test component hay kéo thả.
- Giữ mỗi file trong `src` dưới 200 dòng (CI kiểm).
- Nút/input/textarea lặp lại thì tách thành base component trong `src/components/base/`.
  Base component chỉ nhận `value` + callback qua props, không tự chứa logic nghiệp vụ.
  (Node hiển thị trên canvas dùng `NodeShell` làm base card.)

## Những cái bẫy đã cắn

- **State node nằm ở `useNodesState`, không phải `useReactFlow`.** `useReactFlow().setNodes`
  ghi vào store nội bộ rồi bị prop `nodes` ghi đè ở render kế — node hiện ra rồi biến mất.
  Chỉ lấy view helper (`screenToFlowPosition`, `fitView`) từ nó.
- **Id handle nhánh `"true"`/`"false"` là một contract** chung giữa ConditionNode,
  validate.ts và compile.ts, export thành `BRANCH` trong types.ts. Không test nào phủ phía
  component, nên dùng `BRANCH` thay vì viết chuỗi trực tiếp.
- **`fitView` dạng prop của `<ReactFlow>` đã bị gỡ** — nó phóng canvas lên 200% khi có node
  đầu tiên. `fitView()` gọi tay từ hook (cho focus/sample) thì không sao.
- **Load mẫu phải đẩy `nextId` vượt qua các node của mẫu**, không thì node thả kế tiếp trùng
  id với mẫu và `compile()` ghi đè một entry trong record nodes.

## Tài liệu thiết kế

`docs/` chứa spec và kế hoạch triển khai — phần _tại sao_ đằng sau các quyết định. Nó bị
gitignore (giữ local, không push), nên git không bảo vệ; đừng `git clean -fdx` khi chưa
backup.
