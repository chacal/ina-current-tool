import time
import os
import CHIP_IO.GPIO
from luma.core.interface.serial import spi
from luma.core.render import canvas
from luma.lcd.device import st7735
from PIL import ImageFont
from socketIO_client import SocketIO, BaseNamespace


serial = spi(port=32766, device=0, gpio=CHIP_IO.GPIO, gpio_DC="CSID1", gpio_RST="CSID0")
device = st7735(serial, 128, 128, bgr=True)

font_path = os.path.abspath(os.path.join(os.path.dirname(__file__), 'Roboto-Medium.ttf'))
roboto = ImageFont.truetype(font_path, 20)


class PeriodicSampleNamespace(BaseNamespace):
    def __init__(self, io, path):
        super(PeriodicSampleNamespace, self).__init__(io, path)
        self.on('periodic-sample', self.on_sample)

    def on_sample(self, sample):
        with canvas(device) as draw:
            draw.text((3, 3), "Value: {}".format(sample), font=roboto, fill="white")


socketIO = SocketIO('localhost', 3001)
socketIO.define(PeriodicSampleNamespace, '/periodic-samples')
socketIO.wait()
