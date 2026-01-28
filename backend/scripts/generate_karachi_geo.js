const fs = require('fs');
const mongoose = require('mongoose');

// ==========================================
// GEOMETRY HELPERS
// ==========================================

class Point {
    constructor(lng, lat) {
        this.lng = lng;
        this.lat = lat;
    }

    static mid(p1, p2) {
        return new Point((p1.lng + p2.lng) / 2, (p1.lat + p2.lat) / 2);
    }

    static distance(p1, p2) {
        return Math.sqrt(Math.pow(p1.lng - p2.lng, 2) + Math.pow(p1.lat - p2.lat, 2));
    }
}

class Polyline {
    constructor(points) {
        this.points = points; // Array of Point
    }

    length() {
        let len = 0;
        for (let i = 0; i < this.points.length - 1; i++) {
            len += Point.distance(this.points[i], this.points[i + 1]);
        }
        return len;
    }

    // Split polyline into two at fraction t (0..1)
    // Returns [Polyline, Polyline]
    split(t) {
        const totalLen = this.length();
        const targetLen = totalLen * t;

        let currentLen = 0;
        for (let i = 0; i < this.points.length - 1; i++) {
            const p1 = this.points[i];
            const p2 = this.points[i + 1];
            const segLen = Point.distance(p1, p2);

            if (currentLen + segLen >= targetLen) {
                // Split occurs in this segment
                const remaining = targetLen - currentLen;
                const ratio = remaining / segLen;

                const splitPoint = new Point(
                    p1.lng + (p2.lng - p1.lng) * ratio,
                    p1.lat + (p2.lat - p1.lat) * ratio
                );

                // Construct first half: points[0..i] + splitPoint
                const points1 = this.points.slice(0, i + 1);
                points1.push(splitPoint);

                // Construct second half: splitPoint + points[i+1..end]
                const points2 = [splitPoint, ...this.points.slice(i + 1)];

                return [new Polyline(points1), new Polyline(points2)];
            }

            currentLen += segLen;
        }

        // Fallback (t=1)
        return [this, new Polyline([this.points[this.points.length - 1]])];
    }

    // Create a jagged line between p1 and p2
    // jaggedness: 0..1 (intensity of random offset)
    static generateJagged(p1, p2, jaggedness = 0.05) {
        let points = [p1, p2];
        const iterations = 4; // Detail level

        for (let i = 0; i < iterations; i++) {
            const newPoints = [];
            const spread = jaggedness * Math.pow(0.5, i); // Reduce spread each iteration

            for (let j = 0; j < points.length - 1; j++) {
                const a = points[j];
                const b = points[j + 1];
                newPoints.push(a);

                // Midpoint
                const mid = Point.mid(a, b);

                // Offset perpendicular to segment
                const dx = b.lng - a.lng;
                const dy = b.lat - a.lat;
                // Perpendicular vector (-dy, dx)
                const perpX = -dy;
                const perpY = dx;

                const noise = (Math.random() - 0.5) * spread * Point.distance(a, b); // Scale by segment length

                mid.lng += perpX * noise;
                mid.lat += perpY * noise;

                newPoints.push(mid);
            }
            newPoints.push(points[points.length - 1]);
            points = newPoints;
        }

        return new Polyline(points);
    }
}

class Region {
    // Region defined by 4 boundaries (clockwise: top, right, bottom, left)
    // top, right, bottom, left are Polylines
    constructor(top, right, bottom, left) {
        this.top = top;
        this.right = right;
        this.bottom = bottom;
        this.left = left;
    }

    getCenter() {
        // Approx center
        const tMid = this.top.split(0.5)[0].points.pop();
        const bMid = this.bottom.split(0.5)[0].points.pop();
        return Point.mid(tMid, bMid);
    }

    toGeoJSON() {
        // Merge points: Top -> Right -> Bottom(reversed) -> Left(reversed)
        // Be careful with shared corners

        const coords = [];

        // Top: all points
        coords.push(...this.top.points.map(p => [p.lng, p.lat]));

        // Right: skip first (same as top last), include rest
        coords.push(...this.right.points.slice(1).map(p => [p.lng, p.lat]));

        // Bottom: reverse, skip first (same as right last)
        const bPoints = [...this.bottom.points].reverse();
        coords.push(...bPoints.slice(1).map(p => [p.lng, p.lat]));

        // Left: reverse, skip first (same as bottom first/orig last), skip last (same as top first)
        const lPoints = [...this.left.points].reverse();
        coords.push(...lPoints.slice(1, lPoints.length - 1).map(p => [p.lng, p.lat]));

        // Close the loop
        coords.push([this.top.points[0].lng, this.top.points[0].lat]);

        return {
            type: "Polygon",
            coordinates: [coords]
        };
    }
}

// ==========================================
// DATA GENERATION
// ==========================================

const SOURCE_DATA = {
    "city": "Karachi",
    "districts": [
        {
            "district_name": "Karachi Central",
            "towns": [
                {
                    "town_name": "New Karachi Town",
                    "total_ucs": 13,
                    "ucs": [
                        "UC-01 Kalyana", "UC-02 Sir Syed", "UC-03 Fatima Jinnah Colony",
                        "UC-04 Godhra", "UC-05 Abu Zar Ghaffari", "UC-06 Hakeem Ahsan",
                        "UC-07 Madina Colony", "UC-08 Faisal", "UC-09 Khameeso Goth",
                        "UC-10 Mustufa Colony", "UC-11 Khawaja Ajmeer Nagri",
                        "UC-12 Gulshan-e-Saeed", "UC-13 Shah Nawaz Bhutto Colony"
                    ]
                },
                {
                    "town_name": "North Nazimabad Town",
                    "total_ucs": 10,
                    "ucs": [
                        "UC-01 Paposh Nagar", "UC-02 Pahar Ganj", "UC-03 Khando Goth",
                        "UC-04 Haidery", "UC-05 Sakhi Hasan", "UC-06 Farooq-e-Azam",
                        "UC-07 Nusrat Bhutto Colony", "UC-08 Shadman Town",
                        "UC-09 Buffer Zone", "UC-10 Buffer zone-1"
                    ]
                },
                {
                    "town_name": "Gulberg Town",
                    "total_ucs": 8,
                    "ucs": [
                        "UC-01 Azizabad", "UC-02 Karimabad", "UC-03 Aisha Manzil",
                        "UC-04 Ancholi", "UC-05 Nasirabad", "UC-06 Yaseenabad",
                        "UC-07 Water Pump", "UC-08 Shafeeque Mill Colony"
                    ]
                },
                {
                    "town_name": "Liaquatabad Town",
                    "total_ucs": 7,
                    "ucs": [
                        "UC-01 Rizvia Society", "UC-02 Firdos Colony", "UC-03 Super Market",
                        "UC-04 Dak Khana", "UC-05 Qasiambad", "UC-06 Bandhani Colony",
                        "UC-07 Sharifabad"
                    ]
                },
                {
                    "town_name": "Nazimabad Town",
                    "total_ucs": 7,
                    "ucs": [
                        "Commercial Area", "Mujahid Colony", "Nazimabad No.01",
                        "Abbasi Shaheed", "Hadi Market", "Gulbahar", "Ibn-e-Seena"
                    ]
                }
            ]
        },
        {
            "district_name": "Karachi East",
            "towns": [
                {
                    "town_name": "Jinnah Town",
                    "total_ucs": 11,
                    "ucs": [
                        "PECHS I", "PECHS II", "Jut Line", "Jacob Lines",
                        "Jamshed Quarters", "Garden East", "Soldier Bazar"
                    ]
                },
                {
                    "town_name": "Chanesar Town",
                    "total_ucs": 8,
                    "ucs": [
                        "UC-01 Akhtar Colony", "UC-02 Manzoor Colony", "UC-03 Azam Basti",
                        "UC-04 Chanesar Goth", "UC-05 Mehmoodabad"
                    ]
                },
                {
                    "town_name": "Gulshan Town",
                    "total_ucs": 8,
                    "ucs": [
                        "Civic Centre", "Pir Ilahi Buksh Colony", "Essa Nagri",
                        "Gulshan-e-Iqbal", "Gillani Railway Station", "Dalmia", "Jamali Colony"
                    ]
                },
                {
                    "town_name": "Safoora Town",
                    "total_ucs": 8,
                    "ucs": ["Gulzar-e-Hijri", "Safooran Goth", "Sachal Goth", "Al-Azhar Garden"]
                },
                {
                    "town_name": "Sohrab Goth Town",
                    "total_ucs": 8,
                    "ucs": ["Al Asif Square", "New Quetta Town", "Sukhiya Goth", "Ayub Goth"]
                }
            ]
        },
        {
            "district_name": "Karachi South",
            "towns": [
                {
                    "town_name": "Saddar Town",
                    "total_ucs": 13,
                    "ucs": [
                        "UC-01 Old Haji Camp", "UC-02 Garden", "UC-03 Kharadar",
                        "UC-04 City Railway Station", "UC-05 Nanak Wara", "UC-06 Gazdarabad",
                        "UC-07 Millat Nagar", "UC-08 Saddar", "UC-09 Civil Line",
                        "UC-10 Clifton", "UC-11 Kehkashan"
                    ]
                },
                {
                    "town_name": "Lyari Town",
                    "total_ucs": 13,
                    "ucs": [
                        "UC-01 Agra Taj Colony", "UC-02 Darya Abad", "UC-03 Nawabad",
                        "UC-04 Khada Memon Society", "UC-05 Baghdadi", "UC-06 Shah Baig Line",
                        "UC-07 Behar Colony", "UC-08 Ragiwara", "UC-09 Singo Line", "UC-10 Chakiwara"
                    ]
                }
            ]
        },
        {
            "district_name": "Korangi",
            "towns": [
                {
                    "town_name": "Korangi Town",
                    "total_ucs": 11,
                    "ucs": [
                        "UC-01 Bilal Colony", "UC-02 Nasir Colony", "UC-03 Chakra Goth",
                        "UC-04 Mustafa Taj Colony", "UC-05 100 Quarters", "UC-06 Gulzar Colony",
                        "UC-07 Korangi Sector 33", "UC-08 Zaman Town", "UC-09 Hasrat Mohani Colony"
                    ]
                },
                {
                    "town_name": "Landhi Town",
                    "total_ucs": 10,
                    "ucs": [
                        "UC-01 Muzaffarabad Colony", "UC-02 Muslimabad", "UC-03 Daud Colony",
                        "UC-04 Moinabad", "UC-05 Shirafi Goth", "UC-06 Bhutto Nagar",
                        "UC-07 Khawaja Ajmer Nagri", "UC-08 Landhi", "UC-09 Awami Colony"
                    ]
                },
                {
                    "town_name": "Shah Faisal Town",
                    "total_ucs": 8,
                    "ucs": [
                        "UC-01 Natha Khan Goth", "UC-02 Pak Sadat Colony", "UC-03 Drigue Colony",
                        "UC-04 Reta Plot", "UC-05 Moria Goth", "UC-06 Rifah Aam", "UC-07 Al Falah Society"
                    ]
                },
                {
                    "town_name": "Model Colony Town",
                    "total_ucs": 8,
                    "ucs": ["Model Colony", "Kala Board", "Saudabad", "Khokarapar", "Jafar-E-Tayyar"]
                }
            ]
        },
        {
            "district_name": "Malir",
            "towns": [
                {
                    "town_name": "Malir Town",
                    "total_ucs": 10,
                    "ucs": ["Gharibabad", "Ghazi Brohi Goth", "Malir Colony", "Kala Board"]
                },
                {
                    "town_name": "Gadap Town",
                    "total_ucs": 9,
                    "ucs": [
                        "UC-01 Murad Memon Goth", "UC-02 Darsano Chana", "UC-03 Gadap",
                        "UC-04 Gujro", "UC-05 Songal", "UC-06 Maymarabad",
                        "UC-07 Yousuf Goth", "UC-08 Mangopir"
                    ]
                },
                {
                    "town_name": "Ibrahim Hyderi Town",
                    "total_ucs": 11,
                    "ucs": [
                        "UC-01 Ibraheem Hyderi", "UC-02 Rehri", "UC-03 Cattle Colony",
                        "UC-04 Quaidabad", "UC-05 Landhi", "UC-06 Gulshan-E-Hadeed"
                    ]
                }
            ]
        },
        {
            "district_name": "Keamari",
            "towns": [
                {
                    "town_name": "Baldia Town",
                    "total_ucs": 13,
                    "ucs": [
                        "UC-01 Gulshan-E-Ghazi", "UC-02 Itahad Town", "UC-03 Islam Nagar",
                        "UC-04 Nai Abbadi", "UC-05 Saeedabad", "UC-06 Muslim Mujahid Colony",
                        "UC-07 Muhajir Camp", "UC-08 Rasheedabad"
                    ]
                },
                {
                    "town_name": "Mauripur Town",
                    "total_ucs": 11,
                    "ucs": ["Bhutta Village", "Sultanabad", "Kemari", "Baba Bhit", "Machar Colony", "Maripur"]
                },
                {
                    "town_name": "SITE Town",
                    "total_ucs": 9,
                    "ucs": ["Shershah", "Gabo Pat", "Pak Colony", "Old Golimar", "Jahanabad", "Metrovil"]
                }
            ]
        },
        {
            "district_name": "Karachi West",
            "towns": [
                {
                    "town_name": "Orangi Town",
                    "total_ucs": 15,
                    "ucs": [
                        "UC-01 Mominabad", "UC-02 Haryana Colony", "UC-03 Hanifabad",
                        "UC-04 Mohammad Nagar", "UC-05 Madina Colony", "UC-06 Ghaziabad",
                        "UC-07 Chisti Nagar", "UC-08 Bilal Colony", "UC-09 Iqbal Baloch Colony"
                    ]
                },
                {
                    "town_name": "Mominabad Town",
                    "total_ucs": 9,
                    "ucs": ["Data Nagar", "Mujahidabad", "Baloch Goth", "Frontier Colony"]
                },
                {
                    "town_name": "Manghopir Town",
                    "total_ucs": 16,
                    "ucs": [
                        "UC-01 Mai Garhi", "UC-02 Manghoopir", "UC-03 Pakhtoonabad",
                        "UC-04 Surjani Town", "UC-05 Yousuf Goth", "UC-06 Raheem Goth",
                        "UC-12 Gulshan-e-Mayman", "UC-14 Kunwari Colony"
                    ]
                }
            ]
        }
    ]
};

// Karachi Bounding Box
const KB = {
    minLng: 66.80, maxLng: 67.20,
    minLat: 24.75, maxLat: 25.15
};

// Initial City Region (Rectangle)
// We add slight jaggedness initially to avoiding creating a perfect box even for the city
const cityTop = Polyline.generateJagged(new Point(KB.minLng, KB.maxLat), new Point(KB.maxLng, KB.maxLat), 0.05);
const cityRight = Polyline.generateJagged(new Point(KB.maxLng, KB.maxLat), new Point(KB.maxLng, KB.minLat), 0.05);
const cityBottom = Polyline.generateJagged(new Point(KB.maxLng, KB.minLat), new Point(KB.minLng, KB.minLat), 0.05);
const cityLeft = Polyline.generateJagged(new Point(KB.minLng, KB.minLat), new Point(KB.minLng, KB.maxLat), 0.05);

const INITIAL_REGION = new Region(cityTop, cityRight, cityBottom, cityLeft);


// Recursive Subdivision function returning [ { item, region } ... ]
function subdivideRegion(region, items) {
    // Determine bounding box of current region (approx) to decide split direction
    // This is a simplification; we look at center points of edges
    const width = Point.distance(region.top.split(0.5)[0].points.pop(), region.right.split(0.5)[0].points.pop()) * 1.5; // heuristic
    const height = Point.distance(region.top.split(0.5)[0].points.pop(), region.bottom.split(0.5)[0].points.pop());

    // Use simple coordinate diff of corners
    const w = Math.abs(region.right.points[0].lng - region.left.points[0].lng);
    const h = Math.abs(region.top.points[0].lat - region.bottom.points[0].lat);
    const isWide = w > h;

    const totalWeight = items.reduce((s, i) => s + (i.weight || 1), 0);

    let currentResults = [];
    let remainingRegion = region;
    let remainingWeight = totalWeight;

    // We process items one by one (or in groups). Simpler: just iteratively slice off chunks.
    // We slice N-1 times for N items.

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const itemWeight = item.weight || 1;

        if (i === items.length - 1) {
            // Last item gets the rest
            currentResults.push({ item, region: remainingRegion });
        } else {
            // Calculate fraction for this slice
            const fraction = itemWeight / remainingWeight;

            // Perform split
            // If wide, we split vertically (move left to right)
            // Top and Bottom are "Rails", we cut connecting them.
            // But wait: Region defines Top, Right, Bottom, Left.
            // If Wide: Rails are Top and Bottom. Cut connects Top and Bottom.
            // Left side becomes new region. Right side becomes remaining.

            let r1, r2;

            if (isWide) {
                // Vertical Split
                // Split Top and Bottom at fraction
                const [t1, t2] = remainingRegion.top.split(fraction);
                const [b1, b2] = remainingRegion.bottom.split(fraction); // CAUTION: Bottom is usually reversed in winding, but here it's just a Polyline L->R or R->L?
                // Let's assume Region constructor puts Polylines in consistent direction?
                // Actually, to make logic simple: 
                // Let's assume Top is L->R, Bottom is R->L (Clockwise).
                // If split at fraction f from start of Top, we should split at fraction f from END of Bottom (which is start of Bottom in CW).
                // Let's verify Region construction.

                // Initial City: Top L->R. Bottom R->L.
                // So split(f) on Top matches split(f) on Bottom (if we treat Bottom as R->L).
                // Wait, standard visual: Top and Bottom parallel. 
                // Top: (0,1)->(1,1). Bottom: (1,0)->(0,0).
                // Split at x=0.3. Top(0.3). Bottom(0.3 of its geometric length starting from right).
                // Yes, split(f) on Top corresponds to split(f) on Bottom.

                // Create Cut Line
                const pTop = t1.points[t1.points.length - 1]; // End of t1
                const pBot = b1.points[b1.points.length - 1]; // End of b1

                const cutLine = Polyline.generateJagged(pTop, pBot, 0.05); // Jagged cut line
                const cutLineRev = new Polyline([...cutLine.points].reverse());

                // New Region (Left Side):
                // Top: t1
                // Right: cutLine
                // Bottom: b1
                // Left: remainingRegion.left
                r1 = new Region(t1, cutLine, b1, remainingRegion.left);

                // Remaining Region (Right Side):
                // Top: t2
                // Right: remainingRegion.right
                // Bottom: b2
                // Left: cutLineRev
                remainingRegion = new Region(t2, remainingRegion.right, b2, cutLineRev);

            } else {
                // Horizontal Split (Split Left and Right rails)
                // Left is Bottom->Top (CW). Right is Top->Bottom (CW).
                // Split fraction f of Left (starts at bottom) -> match with Right?
                // Let's visualize: 
                // Left: (0,0)->(0,1). Right: (1,1)->(1,0).
                // Split y=0.3. 
                // Left(0.3) is y=0.3. Right(0.7 technically if length based, or 0.3 from end).
                // Let's be careful.
                // A simpler way: assume normalized direction for splitting logic, then reverse for storage.

                // For correct mapping, we need "Top-ish" and "Bottom-ish" ends of the rails to align.
                // Left goes B->T. Right goes T->B.
                // If we want to split horizontally (Bottom chunk, Top chunk).
                // Bottom Chunk: fraction f of Left (from start). fraction f of Right (from END).

                const [l1, l2] = remainingRegion.left.split(fraction); // l1 is bottom part
                // For Right, we need the bottom part, which is the checking LAST part of the array
                // We split Right at (1-fraction).
                const [rTop, rBot] = remainingRegion.right.split(1 - fraction); // rTop is first part (top), rBot is second (bottom)

                // Create Cut Line connecting Left-End to Right-Start (of rBot, which is actually rBot[0]?)
                // l1 ends at split point.
                // rBot starts at split point.
                // So connect l1.end to rBot.start ??
                // Right is T->B. split gives [TopPart, BotPart]. 
                // rTop ends at split. rBot starts at split.
                // So Cut goes from l1.end (Left Split) to rTop.end (Right Split).
                const pLeft = l1.points[l1.points.length - 1];
                const pRight = rTop.points[rTop.points.length - 1];

                const cutLine = Polyline.generateJagged(pLeft, pRight, 0.05);
                const cutLineRev = new Polyline([...cutLine.points].reverse());

                // Region 1 (Bottom Chunk)
                // Top: cutLine
                // Right: rBot
                // Bottom: remainingRegion.bottom
                // Left: l1
                r1 = new Region(cutLine, rBot, remainingRegion.bottom, l1);

                // Remaining Region (Top Chunk)
                // Top: remainingRegion.top
                // Right: rTop
                // Bottom: cutLineRev
                // Left: l2
                remainingRegion = new Region(remainingRegion.top, rTop, cutLineRev, l2);
            }

            currentResults.push({ item, region: r1 });
            remainingWeight -= itemWeight;
        }
    }

    return currentResults;
}


// Parse UCs
function parseUCName(ucString) {
    const match = ucString.match(/UC-(\d+)\s+(.+)/i);
    if (match) {
        return { number: parseInt(match[1]), name: match[2] };
    }
    return { number: null, name: ucString };
}

function generate() {
    const cityId = new mongoose.Types.ObjectId();
    const cityCode = "KAR-" + Math.random().toString(36).substring(2, 5).toUpperCase();

    // Prepare Hierarchy
    const districtItems = SOURCE_DATA.districts.map(d => {
        const townItems = d.towns.map(t => {
            const parsedUCs = t.ucs.map((uStr) => {
                const p = parseUCName(uStr);
                return {
                    originalString: uStr,
                    name: p.name,
                    tempNumber: p.number
                };
            });

            // Fix numbers
            let maxNum = 0;
            parsedUCs.forEach(u => { if (u.tempNumber && u.tempNumber > maxNum) maxNum = u.tempNumber; });
            let nextNum = maxNum + 1;
            parsedUCs.forEach(u => {
                if (!u.tempNumber) u.tempNumber = nextNum++;
                u.weight = 1 + Math.random() * 0.5; // Slight weight variation for realism
            });

            return {
                name: t.town_name,
                ucs: parsedUCs,
                weight: parsedUCs.length // Weight by UC count
            };
        });

        return {
            name: d.district_name,
            towns: townItems,
            weight: townItems.reduce((s, t) => s + t.weight, 0)
        };
    });

    const city = {
        _id: cityId,
        name: "Karachi",
        code: cityCode,
        province: "Sindh",
        country: "Pakistan",
        center: { type: "Point", coordinates: [67.0, 24.9] }, // hardcoded center
        boundary: INITIAL_REGION.toGeoJSON(),
        totalTowns: 0,
        totalUCs: 0
    };

    const allTowns = [];
    const allUCs = [];

    // Generate
    const dLayout = subdivideRegion(INITIAL_REGION, districtItems);

    dLayout.forEach(d => {
        // d.item is districtItem, d.region is District Region
        const tLayout = subdivideRegion(d.region, d.item.towns);

        tLayout.forEach(t => {
            const townId = new mongoose.Types.ObjectId();
            const townPrefix = t.item.name.substring(0, 2).toUpperCase().replace(/[^A-Z]/g, 'X');
            const townSuffix = Math.random().toString(36).substring(2, 4).toUpperCase();
            const townCode = `${cityCode}-${townPrefix}${townSuffix}`;

            const tCenter = t.region.getCenter();

            allTowns.push({
                _id: townId,
                name: t.item.name,
                code: townCode,
                city: cityId,
                center: { type: "Point", coordinates: [tCenter.lng, tCenter.lat] },
                boundary: t.region.toGeoJSON(),
                totalUCs: t.item.ucs.length
            });

            const uLayout = subdivideRegion(t.region, t.item.ucs);

            uLayout.forEach(u => { // u: { item: ucItem, region: ucRegion }
                const ucId = new mongoose.Types.ObjectId();
                const ucCode = `${townCode}-UC${u.item.tempNumber.toString().padStart(3, '0')}`;
                const uCenter = u.region.getCenter();

                allUCs.push({
                    _id: ucId,
                    name: u.item.name,
                    code: ucCode,
                    ucNumber: u.item.tempNumber,
                    town: townId,
                    city: cityId,
                    center: { type: "Point", coordinates: [uCenter.lng, uCenter.lat] },
                    boundary: u.region.toGeoJSON()
                });
            });
        });
    });

    city.totalTowns = allTowns.length;
    city.totalUCs = allUCs.length;

    return { city, towns: allTowns, ucs: allUCs };
}

const result = generate();
console.log(JSON.stringify(result, null, 2));
