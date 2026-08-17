import os

os.environ["FLAGS_use_mkldnn"] = "0"
os.environ["FLAGS_enable_pir_api"] = "0"

import cv2
import re
from paddleocr import PaddleOCR


# =========================
# LOAD OCR ONCE
# =========================

ocr = PaddleOCR(
    lang="en",
    enable_mkldnn=False,
    use_doc_orientation_classify=False,
    use_doc_unwarping=False,
    use_textline_orientation=False,
)


# =========================
# DETECT PLATE
# =========================

def detect_plate(image):

    if image is None or image.size == 0:

        return None, None


    # =========================
    # GRAYSCALE
    # =========================

    gray = cv2.cvtColor(
        image,
        cv2.COLOR_BGR2GRAY
    )

    gray = cv2.GaussianBlur(
        gray,
        (5, 5),
        0
    )


    # =========================
    # EDGES
    # =========================

    edges = cv2.Canny(
        gray,
        100,
        200
    )


    # =========================
    # FIND CONTOURS
    # =========================

    contours, _ = cv2.findContours(
        edges,
        cv2.RETR_LIST,
        cv2.CHAIN_APPROX_SIMPLE
    )


    candidates = []


    for contour in contours:

        x, y, w, h = cv2.boundingRect(
            contour
        )


        if w < 40 or h < 10:
            continue


        ratio = w / h


        if 2.0 <= ratio <= 6.0:

            candidates.append(
                (x, y, w, h)
            )


    # =========================
    # FIND BEST CANDIDATE
    # =========================

    best_candidate = None
    best_text = ""
    best_score = 0


    for x, y, w, h in candidates:

        plate = image[
            y:y + h,
            x:x + w
        ]


        if plate.size == 0:
            continue


        # =========================
        # OCR
        # =========================

        result = ocr.predict(
            plate
        )


        for res in result:

            texts = res.get(
                "rec_texts",
                []
            )

            scores = res.get(
                "rec_scores",
                []
            )


            for text, score in zip(
                texts,
                scores
            ):


                # =========================
                # CLEAN TEXT
                # =========================

                cleaned = re.sub(
                    r"[^A-Za-z0-9]",
                    "",
                    text
                )


                if len(cleaned) < 4:
                    continue


                if len(cleaned) > 12:
                    continue


                # =========================
                # SCORE
                # =========================

                candidate_score = float(
                    score
                )


                has_letters = any(
                    c.isalpha()
                    for c in cleaned
                )


                has_numbers = any(
                    c.isdigit()
                    for c in cleaned
                )


                if has_letters and has_numbers:

                    candidate_score += 0.3


                # =========================
                # BEST
                # =========================

                if candidate_score > best_score:

                    best_score = candidate_score

                    best_text = cleaned

                    best_candidate = (
                        x,
                        y,
                        w,
                        h
                    )


    # =========================
    # NO PLATE
    # =========================

    if best_candidate is None:

        return None, None


    # =========================
    # CROP PLATE
    # =========================

    x, y, w, h = best_candidate


    plate = image[
        y:y + h,
        x:x + w
    ]


    # =========================
    # RETURN
    # =========================

    return best_text, plate