// Generates sample synthetic videos for instant testing if user hasn't uploaded videos yet.

export async function createDemoSwingVideo(type = 'user') {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 640;
    const ctx = canvas.getContext('2d');

    const stream = canvas.captureStream(60); // 60 FPS synthetic video
    let mimeType = 'video/webm;codecs=vp9';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm';
    }
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/mp4';
    }

    const recorder = new MediaRecorder(stream, { mimeType });
    const chunks = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      resolve(blob);
    };

    recorder.start();

    const durationFrames = 180; // 3 seconds at 60fps
    let frame = 0;

    const isPro = type === 'pro';
    const mainColor = isPro ? '#38bdf8' : '#f43f5e'; // Cyan for Pro, Rose for User
    const title = isPro ? 'PRO SWING (DEMO)' : 'USER SWING (DEMO)';

    function renderFrame() {
      if (frame > durationFrames) {
        recorder.stop();
        return;
      }

      // Background
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid / Turf line
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      ctx.fillStyle = '#166534';
      ctx.fillRect(0, 520, canvas.width, 120);

      // Title
      ctx.fillStyle = mainColor;
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(title, canvas.width / 2, 40);

      // Frame counter & time
      const timeSec = (frame / 60).toFixed(2);
      ctx.fillStyle = '#9ca3af';
      ctx.font = '14px monospace';
      ctx.fillText(`Time: ${timeSec}s | Frame: ${frame}/180`, canvas.width / 2, 70);

      // Impact frame marker highlight at frame 100
      if (frame >= 98 && frame <= 102) {
        ctx.fillStyle = '#eab308';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText('⚡ IMPACT FRAME ⚡', canvas.width / 2, 100);
      }

      // Swing math animation
      // 0 to 70: Backswing (slow)
      // 70 to 100: Downswing to Impact (fast)
      // 100 to 180: Follow-through
      let angle = 0;
      if (frame <= 70) {
        // Backswing 0 deg to -150 deg
        const progress = frame / 70;
        angle = -150 * Math.sin(progress * (Math.PI / 2));
      } else if (frame <= 100) {
        // Downswing -150 deg to 0 deg (Impact)
        const progress = (frame - 70) / 30;
        angle = -150 + 150 * (progress * progress); // Accelerating
      } else {
        // Follow-through 0 deg to 120 deg
        const progress = (frame - 100) / 80;
        angle = 120 * Math.sin(progress * (Math.PI / 2));
      }

      // Slightly different tempo for user vs pro to test sync!
      if (!isPro) {
        // User reaches impact at frame 110 instead of 100
        let userFrame = frame;
        if (userFrame <= 80) {
          angle = -140 * Math.sin((userFrame / 80) * (Math.PI / 2));
        } else if (userFrame <= 110) {
          const p = (userFrame - 80) / 30;
          angle = -140 + 140 * (p * p);
        } else {
          const p = (userFrame - 110) / 70;
          angle = 110 * Math.sin(p * (Math.PI / 2));
        }
      }

      // Golfer body center
      const headX = 240;
      const headY = 220;
      const hipX = 240;
      const hipY = 360;
      const feetX = 240;
      const feetY = 520;

      // Golf ball position
      const ballX = 240;
      const ballY = 515;

      // Draw golf ball
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ballX, ballY, 8, 0, Math.PI * 2);
      ctx.fill();

      // Head
      ctx.strokeStyle = mainColor;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(headX, headY, 20, 0, Math.PI * 2);
      ctx.stroke();

      // Spine
      ctx.beginPath();
      ctx.moveTo(headX, headY + 20);
      ctx.lineTo(hipX, hipY);
      ctx.stroke();

      // Legs
      ctx.beginPath();
      ctx.moveTo(hipX, hipY);
      ctx.lineTo(feetX - 40, feetY);
      ctx.moveTo(hipX, hipY);
      ctx.lineTo(feetX + 40, feetY);
      ctx.stroke();

      // Shoulders & Arms rotation
      const rad = ((angle - 90) * Math.PI) / 180;
      const armLength = 110;
      const handX = headX + Math.cos(rad) * armLength;
      const handY = (headY + 50) + Math.sin(rad) * armLength;

      // Arms
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(headX, headY + 40);
      ctx.lineTo(handX, handY);
      ctx.stroke();

      // Golf Club Shaft
      const clubLength = 130;
      const clubRad = rad + (angle < 0 ? -0.3 : 0.2); // Shaft lag
      const clubHeadX = handX + Math.cos(clubRad) * clubLength;
      const clubHeadY = handY + Math.sin(clubRad) * clubLength;

      ctx.strokeStyle = isPro ? '#f59e0b' : '#a855f7';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(handX, handY);
      ctx.lineTo(clubHeadX, clubHeadY);
      ctx.stroke();

      // Clubhead
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.arc(clubHeadX, clubHeadY, 7, 0, Math.PI * 2);
      ctx.fill();

      // Swing Plane guide line (Pro feature)
      if (isPro) {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(100, 520);
        ctx.lineTo(380, 180);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      frame++;
      setTimeout(renderFrame, 1000 / 60);
    }

    renderFrame();
  });
}
