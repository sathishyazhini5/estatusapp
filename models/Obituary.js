const client = require('../database/db');



const findObituary = async (
    provincecode = 'ALL',
    searchtxt = '',
    memtyp = 'ALL',
    languagecode = 'ALL',
    dcountry = 'ALL',
    ocountry = 'ALL',
    fromdate = '',
    todate = ''
) => {
    provincecode = provincecode || 'ALL';
    searchtxt = searchtxt.trim();
    memtyp = memtyp || 'ALL';
    languagecode = languagecode || 'ALL';
    dcountry = dcountry || 'ALL';
    ocountry = ocountry || 'ALL';

    console.log("🔍 Query Filters:");
    console.log({ provincecode, searchtxt, memtyp, languagecode, dcountry, ocountry, fromdate, todate });

    let query = `
        SELECT DISTINCT ON (od.obituary_code) 
            od.*, 
            pm.province_name,
            qc.quickcode_name AS member_type_name,
            dc.country_name AS death_country_name,
            oc.country_name AS origin_country_name,
            lm.language_name
        FROM estatus.obituary_dtl od
        LEFT JOIN estatus.province_mst pm ON od.province_code = pm.province_code
        LEFT JOIN estatus.quickcode_mst qc ON od.member_type_code = qc.quick_code AND qc.quick_code_type = 'memtyp'
        LEFT JOIN estatus.country_mst dc ON od.death_country_code = dc.country_code
        LEFT JOIN estatus.country_mst oc ON od.orgin_country_code = oc.country_code
        LEFT JOIN estatus.languagemetadata lm ON od.language_code = lm.language_code
        WHERE 
            ($1 = 'ALL' OR od.province_code = $1)
        AND (
            ($2 = '' OR od.disease_name ILIKE $2) OR ($2 = '' OR od.death_place ILIKE $2)
        )
        AND (
            CASE 
                WHEN $1 = 'ALL' THEN ($3 = 'ALL' OR od.member_type_code = $3 OR qc.quickcode_name = $3)
                ELSE ($3 = 'ALL' OR od.member_type_code = $3)
            END
        )
        AND (
            CASE 
                WHEN $1 = 'ALL' THEN ($4 = 'ALL' OR dc.country_name = $4)
                ELSE ($4 = 'ALL' OR od.death_country_code = $4)
            END
        )
        AND (
            CASE 
                WHEN $1 = 'ALL' THEN ($5 = 'ALL' OR oc.country_name = $5)
                ELSE ($5 = 'ALL' OR od.orgin_country_code = $5)
            END
        )
        AND (
            CASE 
                WHEN $1 = 'ALL' THEN ($6 = 'ALL' OR lm.language_name = $6)
                ELSE ($6 = 'ALL' OR od.language_code = $6)
            END
        )
    `;

    let params = [provincecode, `%${searchtxt}%`, memtyp, dcountry, ocountry, languagecode];

    if (fromdate) {
        query += ` AND od.death_date >= $${params.length + 1}`;
        params.push(fromdate);
    }
    if (todate) {
        query += ` AND od.death_date <= $${params.length + 1}`;
        params.push(todate);
    }

    query += ` ORDER BY od.obituary_code ASC`;

    console.log("🛠 Final SQL Query:", query);
    console.log("📌 Query Params:", params);

    try {
        const result = await client.query(query, params);
        console.log("✅ Query Result:", result.rows);
        return result.rows;
    } catch (error) {
        console.error("❌ Database Query Error:", error);
        throw error;
    }
};


const findAnniversary = async (deathdate) => {
    try {
        const [, month, day] = deathdate.split('-');

        const query = `
            SELECT DISTINCT ON (od.obituary_code) od.*, 
                   pm.province_name,
                   mt.quickcode_name AS member_type_name,
                   dc.country_name AS death_country_name,
                   oc.country_name AS origin_country_name,
                   lm.language_name
            FROM estatus.obituary_dtl od
            LEFT JOIN estatus.province_mst pm 
                   ON od.province_code = pm.province_code
            LEFT JOIN estatus.quickcode_mst mt 
                   ON od.member_type_code = mt.quick_code 
                   AND mt.quick_code_type = 'memtyp'
            LEFT JOIN estatus.country_mst dc 
                   ON od.death_country_code = dc.country_code
            LEFT JOIN estatus.country_mst oc 
                   ON od.orgin_country_code = oc.country_code
            LEFT JOIN estatus.languagemetadata lm 
                   ON od.language_code = lm.language_code
            WHERE TO_CHAR(od.death_date, 'MM-DD') = $1
            ORDER BY od.obituary_code ASC;
        `;

        const params = [`${month}-${day}`];
        console.log("🛠 Executing Query:", query, "📌 Params:", params);

        const result = await client.query(query, params);

        return result.rows.length > 0 ? result.rows : []
        

    } catch (error) {
        console.error("❌ Database Query Error:", error);
        return {
            status: false,
            statuscode: 500,
            code: "INTERNAL_SERVER_ERROR",
            message: "Internal Server Error. An error occurred while fetching the data.",
            results: []
        };
    }
};

module.exports = { findObituary, findAnniversary };
