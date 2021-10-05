export class Renderer
{
    constructor(gfx, width, height)
    {
        this.gfx = gfx;
        this.width = width;
        this.height = height;
    }

    drawRect(x, y, width, height, filled = false, centered = false)
    {
        if (centered)
        {
            x -= width / 2.0;
            y -= height / 2.0;
        }

        this.gfx.lineWidth = 1;
        this.gfx.rect(x, y, width, height);

        if (filled)
            this.gfx.fill();
        else
            this.gfx.stroke();
    }

    drawCircle(x, y, radius, filled = false, centered = true)
    {
        this.gfx.lineWidth = 1;

        if (!centered)
        {
            x += radius / 2.0;
            y += radius / 2.0;
        }

        this.gfx.beginPath();
        this.gfx.arc(x, y, radius, 0, 2 * Math.PI);

        if (filled)
            this.gfx.fill();
        else
            this.gfx.stroke();
    }

    drawLine(x0, y0, x1, y1, lineWidth = 1)
    {
        this.gfx.lineWidth = lineWidth;

        this.gfx.beginPath();
        this.gfx.moveTo(x0, y0);
        this.gfx.lineTo(x1, y1);
        this.gfx.stroke();
    }

    drawText(x, y, content, fontSize = 20)
    {
        this.gfx.font = fontSize + "px verdana";

        this.gfx.fillText(content, x, y);
    }
}