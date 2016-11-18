// for Processing (https://processing.org/)

import java.util.concurrent.*;
import netP5.*;
import oscP5.*;

OscP5 oscP5;

ConcurrentLinkedQueue<PVector> positions;
PVector lastPos = null;

void setup() {
  fullScreen();
  
  oscP5 = new OscP5(this, 12000);
  oscP5.plug(this, "getPosition", "/position");
  oscP5.plug(this, "endStroke", "/endStroke");
  
  positions = new ConcurrentLinkedQueue<PVector>();
  
  background(0);
}

public void endStroke() {
  positions.add(new PVector(0, 0, 1));
}

public void getPosition(float x, float y) {
  positions.add(new PVector(x, y));
}

void draw() {
  stroke(255);
  
  while (!positions.isEmpty()) {
    PVector pos = positions.poll();
    
    if (pos.z > 0) {
      // stroke end
      lastPos = null;
      continue;
    }
    
    if (lastPos != null) {
      line(lastPos.x, lastPos.y, pos.x, pos.y);
    }
    
    lastPos = pos;
  }
}