#! /usr/bin/env python3

import sys
import nativemessaging
from PyQt5.QtWidgets import *
import threading

exampleBlocklist = ["reddit", "twitter", "twitch"]

class Box(QWidget):

    def __init__(self):
        super().__init__()
        self.thread()
        self.Button()

    def Button(self):
        #add button
        clear_btn = QPushButton('Send example blocklist', self)
        clear_btn.clicked.connect(lambda:self.sendMessage(exampleBlocklist))

        # Set geometry
        self.setGeometry(0,0,200,50)

        # Display QlistWidget
        self.show()

    def sendMessage(self, blocklist):
        blockListStr = blocklist[0] + "\n"+ "\n".join(blocklist[1:])
        print(blockListStr)
        nativemessaging.send_message(nativemessaging.encode_message(blockListStr))

    def thread(self):
        t1 = threading.Thread(target=self.Operation)
        t1.start()

    def Operation(self):
        while True:
            message = nativemessaging.get_message()

            if message == "hello":
                nativemessaging.send_message(nativemessaging.encode_message(f"Message: {message}"))

if __name__ == '__main__':
    app = QApplication(sys.argv)
    w = Box()
    sys.exit(app.exec())