import cv2
import numpy as np
import time
import os
import json
import threading
import requests
import dotenv

from queue import Queue
from datetime import datetime

from ultralytics import YOLO
from plate_utils import detect_plate


dotenv.load_dotenv()


# =========================
# SETTINGS
# =========================

VIDEO_PATH = "videos/parking.mp4"

# Testing
VIOLATION_TIME = int(
    os.getenv(
        "VIOLATION_TIME",
        10
    )
)

EVIDENCE_FOLDER = "evidence"

VIOLATION_FOLDER = "violations"

# Node.js backend
BACKEND_URL = os.getenv(
    "BACKEND_URL"
)
CAMERA_ID = os.getenv(
    "CAMERA_ID"
)
ZONE_ID = os.getenv(
    "ZONE_ID"
)


# =========================
# CREATE FOLDERS
# =========================

os.makedirs(
    EVIDENCE_FOLDER,
    exist_ok=True
)

os.makedirs(
    VIOLATION_FOLDER,
    exist_ok=True
)


# =========================
# LOAD YOLO
# =========================

model = YOLO(
    "yolo11n.pt"
)


# =========================
# OCR QUEUE
# =========================

plate_queue = Queue()


# =========================
# SAVE VIOLATION JSON
# =========================

def save_violation_record(
    vehicle_id,
    plate_number,
    duration,
    timestamp,
    plate_image,
    vehicle_image,
    full_image
):

    record = {
        "vehicle_id": int(vehicle_id),

        "plate_number": (
            plate_number
            if plate_number
            else None
        ),

        "violation": "NO_PARKING",

        "duration": round(
            float(duration),
            1
        ),

        "timestamp": timestamp,

        "plate_image": plate_image,

        "vehicle_image": vehicle_image,

        "full_image": full_image
    }


    # =========================
    # SAVE JSON FILE
    # =========================

    filename = (
        f"violation_vehicle_{vehicle_id}_"
        f"{timestamp}.json"
    )


    filepath = os.path.join(
        VIOLATION_FOLDER,
        filename
    )


    with open(
        filepath,
        "w"
    ) as file:

        json.dump(
            record,
            file,
            indent=4
        )


    print(
        f"\nViolation record saved:"
    )

    print(
        filepath
    )


    # =========================
    # SEND TO NODE BACKEND
    # =========================

    try:

        payload = {

            "cameraId":
                CAMERA_ID,

            "zoneId":
                ZONE_ID,

            "vehicleId":
                int(vehicle_id),

            "plateNumber":
                plate_number,

            "violationType":
                "NO_PARKING",

            "vehicleType":
                "car",

            "duration":
                round(
                    float(duration),
                    1
                ),

            "ocrConfidence":
                None,

            "detectedAt":
                datetime.now().isoformat(),

            "evidence": {

                "plateImage":
                    plate_image,

                "vehicleImage":
                    vehicle_image,

                "fullImage":
                    full_image
            }
        }


        response = requests.post(

            f"{BACKEND_URL}/api/violations",

            json=payload,

            timeout=5
        )

        # =========================
        # SUCCESS
        # =========================

        if response.status_code in [
            200,
            201
        ]:

            response_data = response.json()

            print(
                "\n[BACKEND] Violation "
                "uploaded successfully"
            )

            print(
                f"[BACKEND] MongoDB ID: "
                f"{response_data['data']['_id']}"
            )


        # =========================
        # API ERROR
        # =========================

        else:

            print(
                "\n[BACKEND ERROR] "
                f"Status: {response.status_code}"
            )

            print(
                response.text
            )


    # =========================
    # CONNECTION ERROR
    # =========================

    except requests.exceptions.ConnectionError:

        print(
            "\n[BACKEND ERROR] "
            "Could not connect to Node.js backend"
        )


    # =========================
    # TIMEOUT
    # =========================

    except requests.exceptions.Timeout:

        print(
            "\n[BACKEND ERROR] "
            "Node.js request timed out"
        )


    # =========================
    # OTHER ERROR
    # =========================

    except Exception as e:

        print(
            "\n[BACKEND ERROR]: "
            f"{e}"
        )


    return record

# =========================
# OCR WORKER
# =========================

def plate_worker():

    while True:

        job = plate_queue.get()


        # =========================
        # STOP WORKER
        # =========================

        if job is None:

            plate_queue.task_done()

            break


        vehicle_crop = job[
            "vehicle_crop"
        ]

        track_id = job[
            "track_id"
        ]

        timestamp = job[
            "timestamp"
        ]

        duration = job[
            "duration"
        ]

        vehicle_filepath = job[
            "vehicle_filepath"
        ]

        full_filepath = job[
            "full_filepath"
        ]


        try:

            print(
                f"\n[OCR] Searching plate "
                f"for vehicle {track_id}..."
            )


            # =========================
            # DETECT PLATE
            # =========================

            plate_text, plate_image = detect_plate(
                vehicle_crop
            )


            # =========================
            # PLATE FOUND
            # =========================

            if plate_image is not None:

                plate_filename = (
                    f"plate_vehicle_{track_id}_"
                    f"{timestamp}.jpg"
                )


                plate_filepath = os.path.join(
                    EVIDENCE_FOLDER,
                    plate_filename
                )


                # =========================
                # SAVE PLATE IMAGE
                # =========================

                cv2.imwrite(
                    plate_filepath,
                    plate_image
                )


                print(
                    "\n=========================="
                )

                print(
                    "LICENSE PLATE CANDIDATE"
                )

                print(
                    "=========================="
                )

                print(
                    f"Vehicle ID: {track_id}"
                )

                print(
                    f"OCR text: {plate_text}"
                )

                print(
                    f"Plate image: "
                    f"{plate_filepath}"
                )

                print(
                    "=========================="
                )


                # =========================
                # SAVE JSON
                # =========================

                save_violation_record(
                    vehicle_id=track_id,

                    plate_number=plate_text,

                    duration=duration,

                    timestamp=timestamp,

                    plate_image=plate_filepath,

                    vehicle_image=vehicle_filepath,

                    full_image=full_filepath
                )


            # =========================
            # NO PLATE
            # =========================

            else:

                print(
                    f"\n[OCR] No plate candidate "
                    f"found for vehicle "
                    f"{track_id}"
                )

        except Exception as e:

            print(
                f"\n[OCR ERROR] Vehicle "
                f"{track_id}: {e}"
            )


        finally:

            plate_queue.task_done()


# =========================
# START OCR THREAD
# =========================

ocr_thread = threading.Thread(
    target=plate_worker,
    daemon=True
)

ocr_thread.start()


# =========================
# OPEN VIDEO
# =========================

cap = cv2.VideoCapture(
    VIDEO_PATH
)


if not cap.isOpened():

    print(
        "ERROR: Could not open video"
    )


    plate_queue.put(None)

    ocr_thread.join()

    exit()


print(
    "Video opened successfully!"
)


# =========================
# NO-PARKING ZONE
# =========================

ZONE = np.array([
    (500, 500),
    (1400, 500),
    (1450, 1000),
    (300, 1000)
], np.int32)


# =========================
# VEHICLE DATA
# =========================

vehicle_timers = {}


# Vehicles that already generated
# a violation during this video

violated = set()


# =========================
# MAIN LOOP
# =========================

while True:

    ret, frame = cap.read()


    if not ret:

        print(
            "Video finished."
        )

        break


    # =========================
    # YOLO TRACKING
    # =========================

    results = model.track(
        frame,

        persist=True,

        tracker="bytetrack.yaml",

        classes=[2, 3, 5, 7],

        verbose=False
    )


    annotated_frame = results[
        0
    ].plot()


    # =========================
    # DRAW ZONE
    # =========================

    cv2.polylines(
        annotated_frame,

        [ZONE],

        isClosed=True,

        color=(0, 0, 255),

        thickness=3
    )


    # =========================
    # CHECK VEHICLES
    # =========================

    if results[0].boxes.id is not None:

        boxes = (
            results[0]
            .boxes
            .xyxy
            .cpu()
            .numpy()
        )


        ids = (
            results[0]
            .boxes
            .id
            .cpu()
            .numpy()
        )


        for box, track_id in zip(
            boxes,
            ids
        ):

            x1, y1, x2, y2 = box


            track_id = int(
                track_id
            )


            # =========================
            # BOTTOM CENTER
            # =========================

            center_x = int(
                (x1 + x2) / 2
            )


            center_y = int(
                y2
            )


            # =========================
            # INSIDE / OUTSIDE
            # =========================

            inside = cv2.pointPolygonTest(
                ZONE,

                (
                    center_x,
                    center_y
                ),

                False
            )


            # =========================
            # INSIDE
            # =========================

            if inside >= 0:

                # =========================
                # START TIMER
                # =========================

                if track_id not in vehicle_timers:

                    vehicle_timers[
                        track_id
                    ] = time.time()


                # =========================
                # DURATION
                # =========================

                duration = (
                    time.time()
                    -
                    vehicle_timers[
                        track_id
                    ]
                )


                # =========================
                # ALREADY VIOLATED
                # =========================

                if track_id in violated:

                    status = "VIOLATION"

                    text_color = (
                        0,
                        0,
                        255
                    )


                # =========================
                # NEW VIOLATION
                # =========================

                elif duration >= VIOLATION_TIME:

                    status = "VIOLATION"

                    text_color = (
                        0,
                        0,
                        255
                    )


                    # =========================
                    # MARK VIOLATED
                    # =========================

                    violated.add(
                        track_id
                    )


                    # =========================
                    # TIMESTAMP
                    # =========================

                    timestamp = (
                        datetime.now()
                        .strftime(
                            "%Y%m%d_%H%M%S_%f"
                        )
                    )


                    # =========================
                    # FULL EVIDENCE
                    # =========================

                    full_filename = (
                        f"full_vehicle_{track_id}_"
                        f"{timestamp}.jpg"
                    )


                    full_filepath = os.path.join(
                        EVIDENCE_FOLDER,
                        full_filename
                    )


                    cv2.imwrite(
                        full_filepath,
                        annotated_frame
                    )


                    # =========================
                    # VEHICLE CROP COORDINATES
                    # =========================

                    crop_x1 = max(
                        0,
                        int(x1)
                    )


                    crop_y1 = max(
                        0,
                        int(y1)
                    )


                    crop_x2 = min(
                        frame.shape[1],
                        int(x2)
                    )


                    crop_y2 = min(
                        frame.shape[0],
                        int(y2)
                    )


                    # =========================
                    # VEHICLE CROP
                    # =========================

                    vehicle_crop = frame[
                        crop_y1:crop_y2,
                        crop_x1:crop_x2
                    ]


                    # =========================
                    # SAVE VEHICLE CROP
                    # =========================

                    if vehicle_crop.size > 0:

                        crop_filename = (
                            f"crop_vehicle_{track_id}_"
                            f"{timestamp}.jpg"
                        )


                        crop_filepath = os.path.join(
                            EVIDENCE_FOLDER,
                            crop_filename
                        )


                        cv2.imwrite(
                            crop_filepath,
                            vehicle_crop
                        )


                        print(
                            "\nVehicle crop saved:"
                        )

                        print(
                            crop_filepath
                        )


                        # =========================
                        # ADD OCR JOB
                        # =========================

                        plate_queue.put({

                            "vehicle_crop":
                                vehicle_crop.copy(),

                            "track_id":
                                track_id,

                            "timestamp":
                                timestamp,

                            "duration":
                                duration,

                            "vehicle_filepath":
                                crop_filepath,

                            "full_filepath":
                                full_filepath
                        })


                        print(
                            f"[OCR] Vehicle "
                            f"{track_id} "
                            f"added to OCR queue"
                        )


                    # =========================
                    # VIOLATION LOG
                    # =========================

                    print(
                        "\n=========================="
                    )

                    print(
                        "VIOLATION DETECTED"
                    )

                    print(
                        "=========================="
                    )

                    print(
                        f"Vehicle ID: "
                        f"{track_id}"
                    )

                    print(
                        f"Duration: "
                        f"{duration:.1f} seconds"
                    )

                    print(
                        f"Full evidence: "
                        f"{full_filepath}"
                    )

                    print(
                        "OCR processing "
                        "in background..."
                    )

                    print(
                        "==========================\n"
                    )


                # =========================
                # STILL INSIDE
                # =========================

                else:

                    status = "INSIDE"

                    text_color = (
                        0,
                        255,
                        0
                    )


                # =========================
                # VEHICLE POINT
                # =========================

                cv2.circle(
                    annotated_frame,

                    (
                        center_x,
                        center_y
                    ),

                    6,

                    text_color,

                    -1
                )


                # =========================
                # STATUS
                # =========================

                cv2.putText(
                    annotated_frame,

                    f"ID {track_id} {status}",

                    (
                        int(x1),
                        int(y1) - 35
                    ),

                    cv2.FONT_HERSHEY_SIMPLEX,

                    0.7,

                    text_color,

                    2
                )


                # =========================
                # TIMER
                # =========================

                cv2.putText(
                    annotated_frame,

                    f"Time: {duration:.1f}s",

                    (
                        int(x1),
                        int(y1) - 10
                    ),

                    cv2.FONT_HERSHEY_SIMPLEX,

                    0.7,

                    text_color,

                    2
                )


            # =========================
            # OUTSIDE
            # =========================

            else:

                if track_id in vehicle_timers:

                    del vehicle_timers[
                        track_id
                    ]


                cv2.putText(
                    annotated_frame,

                    f"ID {track_id} OUTSIDE",

                    (
                        int(x1),
                        int(y1) - 10
                    ),

                    cv2.FONT_HERSHEY_SIMPLEX,

                    0.7,

                    (
                        0,
                        0,
                        255
                    ),

                    2
                )


    # =========================
    # DISPLAY
    # =========================

    cv2.imshow(
        "No Parking Detection",
        annotated_frame
    )


    # =========================
    # QUIT
    # =========================

    if (
        cv2.waitKey(1)
        & 0xFF
        == ord("q")
    ):

        break


# =========================
# CLEANUP VIDEO
# =========================

cap.release()

cv2.destroyAllWindows()


# =========================
# WAIT FOR OCR
# =========================

print(
    "\nWaiting for remaining "
    "OCR jobs..."
)


plate_queue.join()


# =========================
# STOP OCR WORKER
# =========================

plate_queue.put(None)

ocr_thread.join()


print(
    "\nAll OCR processing finished."
)

print(
    "Program ended."
)