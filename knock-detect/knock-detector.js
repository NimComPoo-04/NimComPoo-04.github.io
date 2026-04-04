const BLOCK_SIZE = 2048

const STE_COUNT = 2    // Calculate STE every 4 frames, 128 * 4 = 512 samples
const HIST_STE_COUNT = STE_COUNT * 4
const MAD_COUNT = 10
const HIST_MAD_COUNT = MAD_COUNT * 4
const CF_COUNT = 2

// Thing we need to care about,
//
// 1. Get the power carried by a signal,
//    a. Calculate STE of the thing
//    b. Calculate Derivative of STE
//
// 2. Get the impulse carried by signal,
//    a. Calculate Mean Absolute Deviation(of short buffer), multiply by delta time
//
// 3. Get the zero crossing rate,
//    a. effectively substitute for FFT

class KnockProcessor extends AudioWorkletProcessor {
    constructor() {
        super();

        this.buffer = new Float32Array(BLOCK_SIZE);
        this.offset = 0;

        this.STE = 0
        this.STERatio = 0
        this.histSTE = []
        this.frameCount = 0     // which frame are we at

        this.MAD = 0
        this.MADRatio = 0
        this.histMAD = []

        this.CF = 0
    }

    calcMAD() {

        if(this.frameCount % MAD_COUNT != 0) return

        const avg = this.buffer.reduce((a, b) => (a + b)) / BLOCK_SIZE;
        const new_MAD = this.buffer.reduce((a, b) => (a + Math.abs(b - avg))) / BLOCK_SIZE;

        this.MAD = new_MAD

        this.histMAD.push(new_MAD)
        if(this.histMAD.length > HIST_MAD_COUNT)
            this.histMAD.shift()

        this.MADRatio = this.MAD * this.histMAD.length / this.histMAD.reduce((a, b) => a + b)
    }

    // effectively we calculate the integral of x²
    calcSTE() {

        if(this.frameCount % STE_COUNT != 0) return

        const new_STE = this.buffer.reduce((a, b) => (a + b * b)) / BLOCK_SIZE;

        this.histSTE.push(new_STE)
        if(this.histSTE.length > HIST_STE_COUNT)
            this.histSTE.shift()

        const ratio = new_STE * this.histSTE.length / this.histSTE.reduce((a, b) => a + b)

        this.STE = new_STE
        this.STERatio = ratio
    }

    calcCF() {
        if(this.frameCount % CF_COUNT != 0) return
        const new_cf = this.buffer.reduce((a, b) => Math.max(a, Math.max(b))) / (Math.sqrt(this.STE) + 1E-7)
        this.CF = new_cf;
    }

    calcZCR() {
        let count = 0;
        let ptive = this.buffer[0] > 0;
        for(let i = 1; i < this.buffer.length; i++)
        {
            const k = this.buffer[i] > 0;

            if(ptive != k) {
                ptive = k;
                count += 1;
            }
        }
        return count / BLOCK_SIZE;
    }

    static get parameterDescriptors() {
        return [
            {
                name: "thresholdScaleFactor",
                defaultValue: 2.5,
                minValue: 0,
                maxValue: 100
            },
            {
                name: "minThreshold",
                defaultValue: 0.1,
                minValue: 0,
                maxValue: 1
            },
            {
                name: "zeroCrossingRateLimit",
                defaultValue: 0.01,
                minValue: 0,
                maxValue: 1
            },
            {
                name: "crestFactorScaler",
                defaultValue: 0.15,
                minValue: 0,
                maxValue: 1
            },
        ]
    }

    process(input, output, parameters) {

        const thresholdScaleFactor = parameters.thresholdScaleFactor[0]
        const minThreshold = parameters.minThreshold[0]
        const zeroCrossingRateLimit = parameters.zeroCrossingRateLimit[0]
        const crestFactorScaler = parameters.crestFactorScaler[0]

        this.frameCount += 1

        // Read the data from the buffer
        for(let i in output[0][0]) {
            output[0][0][i] = input[0][0][i];
            if(isNaN(input[0][0][i]))
                continue
            this.buffer[this.offset++] = input[0][0][i]
        }

        // Calculate the STE of the thing
        this.calcSTE();
        this.calcMAD();
        this.calcCF();

        // If we read enough samples spit out result
        if(this.offset >= BLOCK_SIZE) {

            const hmad = this.histMAD.reduce((a, b) => a + b) / this.histMAD.length

            const zcr = this.calcZCR();

            let t = 0
            if(this.histSTE.length > 0)
                t =  this.STE * this.histSTE.length / this.histSTE.reduce((a, b) => (a + b))

            const ki = this.STERatio * Math.max(zcr, zeroCrossingRateLimit) / (1 - crestFactorScaler * this.CF)
            const thr = Math.max(hmad * thresholdScaleFactor, minThreshold)

            let hit = false
            if(!this.old_hit && ki > thr) {
                this.histMAD.pop()
                hit = true
            }
            this.old_hit = ki > thr

            if(hit)
                console.log(hit)

            this.port.postMessage({
                Energy: this.STE,
                //Power: this.STERatio,
                MAD: hmad * 2,
                //MADRatio: Math.log10(this.MADRatio + 1E-10) * zcr,
                CF : this.CF / 5,
                ZCR: zcr,
                Threshold: thr,
                Indicator : ki,
                Hit: hit
            })
            this.offset %= BLOCK_SIZE
        }

        return true
    }
}

registerProcessor("knock-detector", KnockProcessor)
