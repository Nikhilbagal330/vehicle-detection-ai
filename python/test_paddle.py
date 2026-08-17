import os

os.environ["FLAGS_use_mkldnn"] = "0"
os.environ["FLAGS_enable_pir_api"] = "0"

import paddle

print("Paddle:", paddle.__version__)
print("Device:", paddle.get_device())

x = paddle.randn([1, 3, 224, 224])

print("Tensor created successfully")
print(x.shape)
