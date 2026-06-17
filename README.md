# A* Vacuum Robot Visualizer

Dự án trực quan hóa 3D thuật toán A* cho bài toán robot hút bụi trên ma trận `A(m,n)`.

## Yêu cầu bài toán

- Gốc tọa độ `(1,1)` ở góc dưới bên trái.
- Mỗi ô là `Dirty (D)` hoặc `Clean (C)`.
- Robot có các hành động `MOVE_LEFT`, `MOVE_RIGHT`, `MOVE_UP`, `MOVE_DOWN`, `SUCK`.
- Chi phí mỗi hành động bằng `1`.
- Sau mỗi hành động, mỗi ô dirty còn lại cộng thêm `1` chi phí.
- Chi phí bước được cài đặt là:

```text
1 + số ô dirty còn lại sau hành động
```

## Thành phần dự án

- `src/`: giao diện React + Three.js để trình diễn 3D.
- `src/components/algorithms/vacuumAStar.js`: thuật toán A* dùng cho giao diện web.
- `notebook/AStar_Vacuum_Robot.ipynb`: bài nộp Python hoàn chỉnh, đã chạy mẫu.
- `samples/`: file CSV và Excel mẫu có hai cột `x`, `y`.

## Chạy giao diện 3D

Yêu cầu Node.js 18 trở lên.

```bash
npm install
npm start
```

Sau đó mở `http://localhost:3000`.

## Chạy notebook

Mở thư mục `notebook` bằng Jupyter Notebook, JupyterLab, VS Code hoặc Google Colab, sau đó chạy:

```text
AStar_Vacuum_Robot.ipynb
```

## Nhập file dirty

CSV hoặc Excel cần có dạng:

```csv
x,y
1,1
4,2
3,4
7,5
```

## Lưu ý độ phức tạp

Trạng thái A* chứa vị trí robot và tập dirty còn lại. Với `d` ô dirty, không gian trạng thái có thể tăng theo `m × n × 2^d`. Nên dùng khoảng 3–10 ô dirty khi trình diễn.

## Nguồn giao diện tham khảo

Giao diện 3D được cải biên từ dự án `zmaqutu/3D-Pathfinding-Visualizer`. Thuật toán, mô hình trạng thái, chi phí và chức năng robot hút bụi đã được viết lại cho đề bài này.
