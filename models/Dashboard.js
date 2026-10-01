const client = require("../database/db");

const viewDashboard = async (provinceCode) => {
    const query = `
        SELECT 
            qm.quick_code_type, 
            qm.quick_code AS type_code, 
            qm.quickcode_name, 
            qm.language_code,
            COALESCE(
                CASE 
                    WHEN qm.quick_code_type = 'divtyp' THEN COUNT(ds.division_type_code)
                    WHEN qm.quick_code_type = 'memtyp' THEN COUNT(cd.member_type_code)
                    WHEN qm.quick_code_type = 'promto' THEN COUNT(spd.promotion_to_code)
                    WHEN qm.quick_code_type = 'schtyp' THEN COUNT(sapd.scholastic_type_code)
                    ELSE 0 
                END, 
                0
            ) AS code_count,
            pm.province_code,
            pm.province_name
        FROM estatus.quickcode_mst AS qm
        LEFT JOIN estatus.division_setup_mst AS ds 
            ON ds.division_type_code = qm.quick_code 
            AND qm.quick_code_type = 'divtyp'
            AND ($3 = 'ALL' OR ds.province_code = $3)
        LEFT JOIN estatus.confreres_dtl AS cd 
            ON cd.member_type_code = qm.quick_code 
            AND qm.quick_code_type = 'memtyp'
            AND ($3 = 'ALL' OR cd.province_code = $3)
        LEFT JOIN estatus.scholastics_admisn_promon_dtl AS spd 
            ON spd.promotion_to_code = qm.quick_code 
            AND qm.quick_code_type = 'promto'
            AND ($3 = 'ALL' OR spd.province_code = $3)
        LEFT JOIN estatus.scholastics_admisn_promon_dtl AS sapd 
            ON sapd.scholastic_type_code = qm.quick_code 
            AND qm.quick_code_type = 'schtyp'
            AND ($3 = 'ALL' OR sapd.province_code = $3)
        LEFT JOIN estatus.province_mst AS pm 
            ON pm.province_code = COALESCE(ds.province_code, cd.province_code, spd.province_code, sapd.province_code, $3)
        WHERE qm.quick_code_type IN ($1, $2, 'promto', 'schtyp') -- Added 'promto' and 'schtyp'
        GROUP BY qm.quick_code_type, qm.quick_code, qm.quickcode_name, qm.language_code, pm.province_code, pm.province_name
        HAVING pm.province_code <> 'ALL'
        ORDER BY 
            pm.province_code ASC,
            CASE 
                WHEN qm.quick_code_type = $1 THEN 1 
                ELSE 2 
            END, 
            qm.quickcode_name ASC, 
            code_count DESC;
    `;

    const values = ['divtyp', 'memtyp', provinceCode];

    try {
        const result = await client.query(query, values);
        return result.rows;
    } catch (error) {
        console.error("Detailed Error:", error);
        throw new Error(`Internal Server Error. An error occurred while fetching the data: ${error.message}`);
    }
};

module.exports = { viewDashboard };
