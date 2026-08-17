import os

os.environ["FLAGS_use_mkldnn"] = "0"

import cv2
from paddleocr import PaddleOCR


ocr = PaddleOCR(
    lang="en"
)


for filename in os.listdir("evidence"):

    if filename.startswith("crop_vehicle_") and filename.endswith(".jpg"):

        filepath = os.path.join(
            "evidence",
            filename
        )

        print(f"\nProcessing: {filename}")

        result = ocr.predict(filepath)

        print(result)