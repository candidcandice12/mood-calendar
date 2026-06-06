export function resizeImage(file, maxSize = 520, quality = 0.58) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("이미지 파일만 선택할 수 있어요."));
      return;
    }

    const reader = new FileReader();

    reader.addEventListener("load", () => {
      const image = new Image();

      image.addEventListener("load", () => {
        const scale = Math.min(maxSize / image.width, maxSize / image.height, 1);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);

        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      });

      image.addEventListener("error", () => reject(new Error("사진을 읽지 못했어요.")));
      image.src = reader.result;
    });

    reader.addEventListener("error", () => reject(new Error("사진을 읽지 못했어요.")));
    reader.readAsDataURL(file);
  });
}
