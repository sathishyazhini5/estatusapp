	const client = require('../database/db');




const findConfreres = async (
  provincecode = 'ALL',
  searchtxt = '',
  memtyp = 'ALL',
  bloodgroup = 'ALL',
  natlty = 'ALL',
  languagecode = 'ALL',
  divtyp = 'ALL',
  subdivision = 'ALL',
  destyp = 'ALL'
) => {
  try {
    provincecode = provincecode || 'ALL';

    // Normalize search text: remove all spaces for space-insensitive matching
    const originalSearchText = (searchtxt ?? '').trim();
    const searchTextNoSpaces = originalSearchText.replace(/\s+/g, '');
    const hasSearchText = originalSearchText && originalSearchText.length > 0;

    memtyp = memtyp || 'ALL';
    bloodgroup = bloodgroup || 'ALL';
    natlty = natlty || 'ALL';
    languagecode = languagecode || 'ALL';
    divtyp = divtyp || 'ALL';
    subdivision = subdivision || 'ALL';
    destyp = destyp || 'ALL';

    // Build WHERE conditions dynamically
    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;

    // Province filter
    if (provincecode !== 'ALL') {
      whereConditions.push(`cd.province_code = $${paramIndex}`);
      queryParams.push(provincecode);
      paramIndex++;
    }

    // Search text filter - space-insensitive global search
    if (hasSearchText) {
      // Search with original text (with spaces)
      const searchConditionsWithSpaces = [
        `cd.first_name ILIKE $${paramIndex}`,
        `cd.middle_name ILIKE $${paramIndex}`,
        `cd.last_name ILIKE $${paramIndex}`,
        `CONCAT_WS(' ', TRIM(cd.first_name), TRIM(cd.middle_name), TRIM(cd.last_name)) ILIKE $${paramIndex}`,
        `cd.personal1_contact_no::TEXT ILIKE $${paramIndex}`,
        `cd.personal2_contact_no::TEXT ILIKE $${paramIndex}`,
        `cd.personal3_contact_no::TEXT ILIKE $${paramIndex}`,
        `cd.watsup1_no::TEXT ILIKE $${paramIndex}`,
        `cd.personal_mailid1 ILIKE $${paramIndex}`
      ];
      
      // Search without spaces (for space-insensitive matching)
      const searchConditionsNoSpaces = [
        `REPLACE(cd.first_name, ' ', '') ILIKE $${paramIndex + 1}`,
        `REPLACE(cd.middle_name, ' ', '') ILIKE $${paramIndex + 1}`,
        `REPLACE(cd.last_name, ' ', '') ILIKE $${paramIndex + 1}`,
        `REPLACE(REPLACE(REPLACE(CONCAT_WS(' ', TRIM(cd.first_name), TRIM(cd.middle_name), TRIM(cd.last_name)), ' ', ''), E'\t', ''), E'\n', '') ILIKE $${paramIndex + 1}`,
        `REPLACE(cd.personal1_contact_no::TEXT, ' ', '') ILIKE $${paramIndex + 1}`,
        `REPLACE(cd.personal2_contact_no::TEXT, ' ', '') ILIKE $${paramIndex + 1}`,
        `REPLACE(cd.personal3_contact_no::TEXT, ' ', '') ILIKE $${paramIndex + 1}`,
        `REPLACE(cd.watsup1_no::TEXT, ' ', '') ILIKE $${paramIndex + 1}`,
        `REPLACE(cd.personal_mailid1, ' ', '') ILIKE $${paramIndex + 1}`
      ];
      
      // Combine both search conditions
      const allSearchConditions = [...searchConditionsWithSpaces, ...searchConditionsNoSpaces];
      whereConditions.push(`(${allSearchConditions.join(' OR ')})`);
      
      // Add both search patterns: with spaces and without spaces
      queryParams.push(`%${originalSearchText}%`);  // Original search with spaces
      queryParams.push(`%${searchTextNoSpaces}%`);  // Search without spaces
      paramIndex += 2;  // Increment by 2 since we added 2 parameters
    }

    // Member type filter
    if (memtyp !== 'ALL') {
      if (provincecode === 'ALL') {
        whereConditions.push(`(cd.member_type_code = $${paramIndex} OR mt.quickcode_name = $${paramIndex})`);
      } else {
        whereConditions.push(`cd.member_type_code = $${paramIndex}`);
      }
      queryParams.push(memtyp);
      paramIndex++;
    }

    // Blood group filter
    if (bloodgroup !== 'ALL') {
      whereConditions.push(`cd.blood_group_code = $${paramIndex}`);
      queryParams.push(bloodgroup);
      paramIndex++;
    }

    // Nationality filter
    if (natlty !== 'ALL') {
      if (provincecode === 'ALL') {
        whereConditions.push(`(cd.nationality_code = $${paramIndex} OR n.quickcode_name = $${paramIndex})`);
      } else {
        whereConditions.push(`cd.nationality_code = $${paramIndex}`);
      }
      queryParams.push(natlty);
      paramIndex++;
    }

    // Language filter
    if (languagecode !== 'ALL') {
      if (provincecode === 'ALL') {
        whereConditions.push(`(cd.language_code = $${paramIndex} OR l.quickcode_name = $${paramIndex})`);
      } else {
        whereConditions.push(`cd.language_code = $${paramIndex}`);
      }
      queryParams.push(languagecode);
      paramIndex++;
    }

    // Division type filter
    if (divtyp !== 'ALL') {
      if (provincecode === 'ALL') {
        whereConditions.push(`(ct.division_type_code = $${paramIndex} OR dt.quickcode_name = $${paramIndex})`);
      } else {
        whereConditions.push(`ct.division_type_code = $${paramIndex}`);
      }
      queryParams.push(divtyp);
      paramIndex++;
    }

    // Subdivision filter
    if (subdivision !== 'ALL') {
      if (provincecode === 'ALL') {
        whereConditions.push(`ds.division_name = $${paramIndex}`);
      } else {
        whereConditions.push(`ds.division_code = $${paramIndex}`);
      }
      queryParams.push(subdivision);
      paramIndex++;
    }

    // Designation filter
    if (destyp !== 'ALL') {
      if (provincecode === 'ALL') {
        whereConditions.push(`(atd.designation_code = $${paramIndex} OR des.quickcode_name = $${paramIndex})`);
      } else {
        whereConditions.push(`atd.designation_code = $${paramIndex}`);
      }
      queryParams.push(destyp);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    const query = `
      SELECT DISTINCT ON (cd.confrer_code) cd.*, 
             pm.province_name,
             mt.quick_code AS member_type_code,
             mt.quickcode_name AS member_type_name,
             n.quick_code AS nationality_code,
             n.quickcode_name AS nationality_name,
             l.quick_code AS language_code,
             l.quickcode_name AS language_name,
             dt.quick_code AS division_type_code,
             dt.quickcode_name AS division_type_name,
             ds.division_code AS subdivision_code,
             ds.division_name AS subdivision,
             des.quick_code AS designation_code,
             des.quickcode_name AS designation_name
      FROM estatus.confreres_dtl cd
      LEFT JOIN estatus.province_mst pm ON cd.province_code = pm.province_code  
      LEFT JOIN estatus.quickcode_mst mt ON cd.member_type_code = mt.quick_code AND mt.quick_code_type = 'memtyp'
      LEFT JOIN estatus.quickcode_mst n  ON cd.nationality_code = n.quick_code AND n.quick_code_type = 'natlty'
      LEFT JOIN estatus.quickcode_mst l  ON cd.language_code = l.quick_code AND l.quick_code_type = 'lancod'
      LEFT JOIN estatus.appoint_transfer_dtl atd ON cd.confrer_code = atd.confrer_code AND cd.province_code = atd.province_code
      LEFT JOIN estatus.centre_dtl ct ON atd.centre_code = ct.centre_code AND atd.province_code = ct.province_code  
                                       AND atd.division_type_code = ct.division_type_code AND atd.division_code = ct.division_code  
      LEFT JOIN estatus.quickcode_mst dt ON ct.division_type_code = dt.quick_code AND dt.quick_code_type = 'divtyp'
      LEFT JOIN estatus.division_setup_mst ds ON ct.division_type_code = ds.division_type_code AND ct.division_code = ds.division_code
                                              AND ct.province_code = ds.province_code
      LEFT JOIN estatus.quickcode_mst des ON atd.designation_code = des.quick_code AND des.quick_code_type = 'destyp'
      ${whereClause}
      ORDER BY 
        cd.confrer_code,
        TRIM(CONCAT_WS(' ', cd.first_name, cd.middle_name, cd.last_name)) ASC
    `;

    const params = queryParams;
    
    console.log("🔍 Final Query:", query.substring(0, 500));
    console.log("🔍 Where Conditions:", whereConditions);
    console.log("🔍 Params Count:", params.length);

    console.log("🔍 Running Confreres Query...");
    console.log("🧩 Params:", params);
    console.log("🔍 Has Search Text:", hasSearchText);
    console.log("🔍 Search Text Value (Original):", originalSearchText);
    console.log("🔍 Search Text Value (No Spaces):", searchTextNoSpaces);
    console.log("🔍 Full Query:", query.replace(/\s+/g, ' ').substring(0, 500));

    try {
      // First test: Simple count query to verify database connection and data
      const countQuery = `SELECT COUNT(*) as total FROM estatus.confreres_dtl`;
      const countResult = await client.query(countQuery);
      console.log("🔍 Total confreres in database:", countResult.rows[0]?.total || 0);
      
      // Execute main query
      const result = await client.query(query, params);
      console.log("📊 Query returned", result?.rows?.length || 0, "rows");
      
      if (result?.rows?.length === 0 && whereConditions.length === 0) {
        // If no filters and still no results, there's a problem
        console.error("❌ No results even without filters! Database might be empty or query has issues.");
        return [];
      }

      if (!result || !Array.isArray(result.rows)) {
        console.warn("⚠️ No results from DB.");
        return [];
      }

      // Remove duplicate confrer_code entries and return
      const uniqueResults = [];
      const seenCodes = new Set();
      
      for (const row of result.rows) {
        if (!seenCodes.has(row.confrer_code)) {
          seenCodes.add(row.confrer_code);
          const { 
            division_type_code, division_type_name,
            subdivision_code, subdivision,
            designation_code, designation_name,
            ...rest 
          } = row;
          uniqueResults.push(rest);
        }
      }

      // Sort by name alphabetically
      uniqueResults.sort((a, b) => {
        const nameA = `${a.first_name || ''} ${a.middle_name || ''} ${a.last_name || ''}`.trim().toLowerCase();
        const nameB = `${b.first_name || ''} ${b.middle_name || ''} ${b.last_name || ''}`.trim().toLowerCase();
        return nameA.localeCompare(nameB);
      });

      console.log("✅ Returning", uniqueResults.length, "unique confreres");
      return uniqueResults;
    } catch (error) {
      console.error("❌ Database Query Error:", error);
      console.error("❌ Error details:", error.message);
      console.error("❌ Query params:", params);
      console.error("❌ Stack:", error.stack);
      throw error;
    }
  } catch (error) {
    console.error("❌ Error in findConfreres:", error);
    return [];
  }
};





const findScholastics = async (
    provincecode = 'ALL',
    searchtxt = '',
    natlty = 'ALL'
) => {
    try {
        provincecode = provincecode || 'ALL';
        searchtxt = searchtxt.trim();
        natlty = natlty || 'ALL';

        let query = `
            SELECT sd.*, 
                   pm.province_name,
                   COALESCE(mt.quickcode_name, 'Scholastic') AS member_type_name,  
                   COALESCE(n.quickcode_name, 'Unknown') AS nationality_name
            FROM estatus.scholastics_dtl sd
            LEFT JOIN estatus.province_mst pm 
                   ON sd.province_code = pm.province_code  
            LEFT JOIN estatus.quickcode_mst mt 
                   ON sd.member_type_code = mt.quick_code 
                   AND mt.quick_code_type = 'memtyp'
            LEFT JOIN estatus.quickcode_mst n 
                   ON sd.nationality_code = n.quick_code 
                   AND n.quick_code_type = 'natlty'
            WHERE 
                ($1 = 'ALL' OR sd.province_code = $1)
                AND ($2 = 'ALL' OR 
                    sd.first_name ILIKE $3 
                    OR sd.middle_name ILIKE $3 
                    OR sd.last_name ILIKE $3 
                    OR sd.personal_mailid1 ILIKE $3
                )
                AND (
                    CASE 
                        WHEN $1 = 'ALL' THEN ($4 = 'ALL' OR sd.nationality_code = $4 OR n.quickcode_name ILIKE $4) -- Filter by name when province is ALL
                        ELSE ($4 = 'ALL' OR sd.nationality_code = $4) -- Filter by code when specific province
                    END
                )
            ORDER BY sd.scholastic_code ASC;
        `;

        let params = [
            provincecode,
            searchtxt !== 'ALL' ? `%${searchtxt}%` : 'ALL',
            searchtxt !== 'ALL' ? `%${searchtxt}%` : 'ALL',
            natlty !== 'ALL' ? natlty.trim() : 'ALL'  // ✅ Trim to remove spaces & ensure exact match
        ];

        console.log("🛠 Executing Query:", query);
        console.log("📌 Query Params:", params);

        const result = await client.query(query, params);

        if (!result || !Array.isArray(result.rows)) {
            console.error("⚠ No data returned from DB, returning empty array.");
            return [];
        }

        return result.rows;

    } catch (error) {
        console.error("❌ Database Query Error:", error);
        return [];
    }
};


const findCentres = async (
  provincecode = 'ALL',
  searchtxt = '',
  divtyp = 'ALL',
  apostl = 'ALL',
  ctrtyp = 'ALL',
  diocse = 'ALL',
  communitygroup = 'ALL',
  language = 'ALL',
  state = 'ALL',
  country = 'ALL',
  subdivision = 'ALL'
) => {
  provincecode = provincecode || 'ALL';
  searchtxt = searchtxt.trim().replace(/\s+/g, ' ');
  const searchPattern = `%${searchtxt}%` || '%';

  divtyp = divtyp || 'ALL';
  apostl = apostl || 'ALL';
  ctrtyp = ctrtyp || 'ALL';
  diocse = diocse || 'ALL';
  communitygroup = communitygroup || 'ALL';
  language = language || 'ALL';
  state = state || 'ALL';
  country = country || 'ALL';
  subdivision = subdivision || 'ALL';

  const query = `
    SELECT 
      cd.*, 
      pm.province_name, 
      sm.state_name,
      cm.country_name,
      COALESCE(ch.community_house_name, 'Not Available') AS community_house_name,
      ds.division_name,  
      dt.quickcode_name AS division_type_name,
      ap.quickcode_name AS apostolate_name,
      ct.quickcode_name AS centre_type_name,
      ln.quickcode_name AS language_name,
      sd.division_code AS subdivision_code,
      sd.division_name AS subdivision_name
    FROM estatus.centre_dtl cd
    LEFT JOIN estatus.province_mst pm ON cd.province_code = pm.province_code
    LEFT JOIN estatus.state_mst sm ON cd.state_code = sm.state_code AND cd.province_code = sm.province_code AND cd.country_code = sm.country_code
    LEFT JOIN estatus.country_mst cm ON cd.country_code = cm.country_code AND cd.province_code = cm.province_code
    LEFT JOIN estatus.community_house_dtl ch ON cd.community_house_code = ch.community_house_code
    LEFT JOIN estatus.division_setup_mst ds ON cd.division_code = ds.division_code AND cd.division_type_code = ds.division_type_code AND cd.province_code = ds.province_code
    LEFT JOIN estatus.quickcode_mst dt ON cd.division_type_code = dt.quick_code AND dt.quick_code_type = 'divtyp'
    LEFT JOIN estatus.quickcode_mst ap ON cd.apostolate_code = ap.quick_code AND ap.quick_code_type = 'apostl'
    LEFT JOIN estatus.quickcode_mst ct ON cd.centre_type_code = ct.quick_code AND ct.quick_code_type = 'ctrtyp'
    LEFT JOIN estatus.quickcode_mst ln ON cd.language_code = ln.quick_code AND ln.quick_code_type = 'lancod'
    LEFT JOIN estatus.division_setup_mst sd ON cd.division_type_code = sd.division_type_code AND cd.division_code = sd.division_code AND cd.province_code = sd.province_code
    WHERE 
      ($1 = 'ALL' OR cd.province_code = $1)
      AND (
        cd.centre_name ILIKE $2
        OR cd.centre_place ILIKE $2
        OR cd.city_dist ILIKE $2
        OR cd.pin_zipcode::TEXT ILIKE $2
        OR cd.phone1_no::TEXT ILIKE $2
        OR cd.phone2_no::TEXT ILIKE $2
        OR cd.phone3_no::TEXT ILIKE $2
        OR cd.watsup_no::TEXT ILIKE $2
        OR cd.office_mailid1 ILIKE $2
        OR cd.office_mailid2 ILIKE $2
        OR cd.website1 ILIKE $2
      )
      AND ($3 = 'ALL' OR cd.division_type_code = $3)
      AND ($4 = 'ALL' OR cd.apostolate_code = $4)
      AND ($5 = 'ALL' OR cd.centre_type_code = $5)
      AND ($6 = 'ALL' OR cd.community_house_code = $6)
      AND ($7 = 'ALL' OR cd.country_code = $7)
      AND ($8 = 'ALL' OR cd.state_code = $8)
      AND ($9 = 'ALL' OR cd.diocese_code = $9)
      AND ($10 = 'ALL' OR cd.language_code = $10)
      AND ($11 = 'ALL' OR cd.division_code = $11)
    ORDER BY cd.centre_code ASC
  `;

  const params = [
    provincecode,
    searchPattern,
    divtyp,
    apostl,
    ctrtyp,
    communitygroup,
    country,
    state,
    diocse,
    language,
    subdivision
  ];

  try {
    console.log("Executing Query:", query);
    console.log("With Parameters:", params);
    const result = await client.query(query, params);
    return result.rows;
  } catch (error) {
    console.error("Database Query Error:", error);
    return [];
  }
};



const viewConfre = async (confrercode) => {
    const query = `SELECT * FROM estatus.confreres_dtl WHERE confrer_code = $1`;
    const params = [confrercode];

    try {
        const result = await client.query(query, params);
        const confrer = result.rows[0];
        if (!confrer) {
            return { error: "Confrere not found" };
        }

        const { province_code, member_type_code } = confrer;

        // Fetch province details
        const result1 = await client.query(`SELECT * FROM estatus.province_mst WHERE province_code = $1`, [province_code]);

        // Fetch member type details
        const result2 = await client.query(`SELECT * FROM estatus.quickcode_mst WHERE quick_code = $1`, [member_type_code]);

        // Fetch all appointment/transfer details (ordered by latest first)
        const result3 = await client.query(
            `SELECT * FROM estatus.appoint_transfer_dtl WHERE confrer_code = $1 ORDER BY designation_appn_date DESC`,
            [confrercode]
        );
        const appointmentList = result3.rows;

        let currentDesignation = {};
        let previousDesignations = [];
        let centreDetails = { name: "N/A", address: "N/A", mobile: "N/A" };

        if (appointmentList.length > 0) {
            const latestAppointment = appointmentList[0];

            // Fetch centre details for the latest appointment (including centre name)
            const centreQuery = `
                SELECT centre_name, address1, address2, address3, city_dist, state_code, country_code, pin_zipcode,
                       phone1_isd, phone1_no 
                FROM estatus.centre_dtl WHERE centre_code = $1`;
            const centreResult = await client.query(centreQuery, [latestAppointment.centre_code]);
            const centreInfo = centreResult.rows[0];

            if (centreInfo) {
                centreDetails = {
                    name: centreInfo.centre_name || "N/A",
                    address: [
                        centreInfo.address1, centreInfo.address2, centreInfo.address3,
                        centreInfo.city_dist, centreInfo.state_code, centreInfo.country_code,
                        centreInfo.pin_zipcode ? `PIN: ${centreInfo.pin_zipcode}` : ''
                    ].filter(Boolean).join(', '), // Combine all address parts
                    
                    mobile: centreInfo.phone1_no
                        ? `${centreInfo.phone1_isd || ''} ${centreInfo.phone1_no}`
                        : 'N/A', // Format mobile number
                };
            }

            // Fetch Designation Name
            const designationResult = await client.query(
                `SELECT quickcode_name FROM estatus.quickcode_mst WHERE quick_code = $1`,
                [latestAppointment.designation_code]
            );

            // Calculate total years and months served
            let totalYearsServed = 0;
            let totalMonthsServed = 0;
            if (latestAppointment.designation_appn_date) {
                const startDate = new Date(latestAppointment.designation_appn_date);
                const currentDate = new Date();

                const yearsDifference = currentDate.getFullYear() - startDate.getFullYear();
                const monthsDifference = currentDate.getMonth() - startDate.getMonth();

                if (monthsDifference < 0) {
                    totalYearsServed = yearsDifference - 1;
                    totalMonthsServed = monthsDifference + 12;
                } else {
                    totalYearsServed = yearsDifference;
                    totalMonthsServed = monthsDifference;
                }
            }

            currentDesignation = {
                designation_name: designationResult.rows[0]?.quickcode_name || 'N/A',
                start_date: latestAppointment.designation_appn_date.toISOString().split('T')[0],
                centre_name: centreDetails.name,
                centre_address: centreDetails.address,
                total_years_served: `${totalYearsServed} Year(s) ${totalMonthsServed} Month(s)`,
            };

            // Fetch previous designations
            for (let i = 1; i < appointmentList.length; i++) {
                const prevAppointment = appointmentList[i];

                // Fetch designation name
                const prevDesignationResult = await client.query(
                    `SELECT quickcode_name FROM estatus.quickcode_mst WHERE quick_code = $1`,
                    [prevAppointment.designation_code]
                );

                // Fetch centre details
                const prevCentreResult = await client.query(centreQuery, [prevAppointment.centre_code]);
                const prevCentreInfo = prevCentreResult.rows[0] || {};

                const prevAddress = [
                    prevCentreInfo.address1, prevCentreInfo.address2, prevCentreInfo.address3,
                    prevCentreInfo.city_dist, prevCentreInfo.state_code, prevCentreInfo.country_code,
                    prevCentreInfo.pin_zipcode ? `PIN: ${prevCentreInfo.pin_zipcode}` : ''
                ].filter(Boolean).join(', ') || 'N/A';

                let prevYearsServed = 0;
                let prevMonthsServed = 0;
                if (prevAppointment.designation_appn_date && prevAppointment.designation_end_date) {
                    const startDate = new Date(prevAppointment.designation_appn_date);
                    const endDate = new Date(prevAppointment.designation_end_date);

                    const yearsDifference = endDate.getFullYear() - startDate.getFullYear();
                    const monthsDifference = endDate.getMonth() - startDate.getMonth();

                    if (monthsDifference < 0) {
                        prevYearsServed = yearsDifference - 1;
                        prevMonthsServed = monthsDifference + 12;
                    } else {
                        prevYearsServed = yearsDifference;
                        prevMonthsServed = monthsDifference;
                    }
                }

                previousDesignations.push({
                    designation_name: prevDesignationResult.rows[0]?.quickcode_name || 'N/A',
                    start_date: prevAppointment.designation_appn_date.toISOString().split('T')[0],
                    end_date: prevAppointment.designation_end_date
                        ? prevAppointment.designation_end_date.toISOString().split('T')[0]
                        : null,
                    centre_name: prevCentreInfo.centre_name || "N/A",
                    centre_address: prevAddress,
                    total_years_served: `${prevYearsServed} Year(s) ${prevMonthsServed} Month(s)`,
                });
            }
        }

        // Modify the `centre_code` object to include name, address & mobile
        confrer.centre_code = {
            confrer_code: confrer.confrer_code,
            province_code: confrer.province_code,
            member_type_code: confrer.member_type_code,
            first_name: confrer.first_name,
            middle_name: confrer.middle_name,
            last_name: confrer.last_name,
            birth_date: confrer.birth_date,
            personal_mailid1: confrer.personal_mailid1,
            centre_name: centreDetails.name,
            address: centreDetails.address,
            mobile: centreDetails.mobile
        };

        return {
            ...confrer,
            province_code: result1.rows[0],
            member_type_code: result2.rows[0],
            current_designation: currentDesignation,
            previous_designations: previousDesignations,
            centre_code: confrer.centre_code
        };

    } catch (error) {
        console.error("Error fetching confrere details:", error);
        throw error;
    }
};


const viewScholastic = async (scholasticCode) => {
    try {
        // Fetch Scholastic Details
        const scholasticQuery = `SELECT * FROM estatus.scholastics_dtl WHERE scholastic_code = $1`;
        const scholasticResult = await client.query(scholasticQuery, [scholasticCode]);

        if (scholasticResult.rows.length === 0) {
            return { error: "Scholastic not found" };
        }

        const scholastic = scholasticResult.rows[0];

        // Function to fetch names for codes
        const fetchName = async (table, codeColumn, nameColumn, code, typeColumn = null, typeValue = null) => {
            let query = `SELECT ${nameColumn} FROM estatus.${table} WHERE ${codeColumn} = $1`;
            let params = [code];

            if (typeColumn && typeValue) {
                query += ` AND ${typeColumn} = $2`;
                params.push(typeValue);
            }

            const res = await client.query(query, params);
            return res.rows.length > 0 ? res.rows[0][nameColumn] : null;
        };

        // Fetch names for respective codes
        const provinceName = await fetchName("province_mst", "province_code", "province_name", scholastic.province_code);
        const nationalityName = await fetchName("quickcode_mst", "quick_code", "quickcode_name", scholastic.nationality_code, "quick_code_type", "natlty");
        const languageName = await fetchName("quickcode_mst", "quick_code", "quickcode_name", scholastic.language_code, "quick_code_type", "lancod");
        const bloodGroupName = await fetchName("bloodgroup_metadata", "bloodgroup", "bloodgroup", scholastic.blood_group_code);

        // Format full name
        const fullName = `${scholastic.first_name || ''} ${scholastic.middle_name || ''} ${scholastic.last_name || ''}`.trim();

        // Fetch feedback details
        const feedbackQuery = `SELECT * FROM estatus.scholastics_feedback_dtl WHERE scholastic_code = $1`;
        const feedbackResult = await client.query(feedbackQuery, [scholasticCode]);
        const feedbackDetails = feedbackResult.rows.length > 0 ? feedbackResult.rows : [];

        // Fetch promotion details (current & previous)
        const promotionQuery = `
            SELECT * FROM estatus.scholastics_admisn_promon_dtl 
            WHERE scholastic_code = $1
            ORDER BY start_date DESC;
        `;
        const promotionResult = await client.query(promotionQuery, [scholasticCode]);

        let currentPromotion = null;
        let previousPromotions = [];

        for (const promo of promotionResult.rows) {
            if (promo.end_date === null) {
                currentPromotion = promo;
            } else {
                previousPromotions.push(promo);
            }
        }

        // Fetch names for current promotion details
        let currentPromotionDetails = null;
        if (currentPromotion) {
            const formationTypeName = await fetchName("quickcode_mst", "quick_code", "quickcode_name", currentPromotion.formation_type_code, "quick_code_type", "fortyp");
            const scholasticTypeName = await fetchName("quickcode_mst", "quick_code", "quickcode_name", currentPromotion.scholastic_type_code, "quick_code_type", "schtyp");
            const promotionToName = await fetchName("quickcode_mst", "quick_code", "quickcode_name", currentPromotion.promotion_to_code, "quick_code_type", "promto");

            currentPromotionDetails = {
                ...currentPromotion,
                formation_type_name: formationTypeName || "Unknown",
                scholastic_type_name: scholasticTypeName || "Unknown",
                promotion_to_name: promotionToName || "Unknown"
            };
        }

        // Fetch names for previous promotion details
        const previousPromotionDetails = await Promise.all(
            previousPromotions.map(async (promo) => {
                const formationTypeName = await fetchName("quickcode_mst", "quick_code", "quickcode_name", promo.formation_type_code, "quick_code_type", "fortyp");
                const scholasticTypeName = await fetchName("quickcode_mst", "quick_code", "quickcode_name", promo.scholastic_type_code, "quick_code_type", "schtyp");
                const promotionToName = await fetchName("quickcode_mst", "quick_code", "quickcode_name", promo.promotion_to_code, "quick_code_type", "promto");

                return {
                    ...promo,
                    formation_type_name: formationTypeName || "Unknown",
                    scholastic_type_name: scholasticTypeName || "Unknown",
                    promotion_to_name: promotionToName || "Unknown"
                };
            })
        );

        // Prepare response object
        return {
            ...scholastic,
            full_name: fullName,
            province_name: provinceName,
            nationality_name: nationalityName,
            language_name: languageName,
            blood_group_name: bloodGroupName,
            feedback_details: feedbackDetails,
            current_promotion_details: currentPromotionDetails,
            previous_promotion_details: previousPromotionDetails
        };

    } catch (error) {
        console.error("Error fetching scholastic details:", error);
        throw error;
    }
};


const viewCentre = async (centrecode) => {
    try {
        // Fetch Centre Details with Correct Division Mapping
        const centreQuery = `
            SELECT 
                c.*, 
                p.province_name,
                dt.quickcode_name AS division_type_name,
                d.division_name,  -- FIXED: Ensuring correct division mapping
                ct.quickcode_name AS centre_type_name,
                ch.community_house_name,
                s.state_name,
                cn.country_name,
                a.apostolate_name
            FROM estatus.centre_dtl c
            LEFT JOIN estatus.province_mst p 
                ON c.province_code = p.province_code
            LEFT JOIN estatus.quickcode_mst dt 
                ON c.division_type_code = dt.quick_code 
                AND dt.quick_code_type = 'divtyp'
            LEFT JOIN estatus.division_setup_mst d 
                ON c.division_code = d.division_code 
                AND c.province_code = d.province_code  -- ✅ FIXED: Ensuring correct division mapping
            LEFT JOIN estatus.quickcode_mst ct 
                ON c.centre_type_code = ct.quick_code 
                AND ct.quick_code_type = 'ctrtyp'
            LEFT JOIN estatus.community_house_dtl ch 
                ON c.community_house_code = ch.community_house_code
            LEFT JOIN estatus.state_mst s 
                ON c.state_code = s.state_code
            LEFT JOIN estatus.country_mst cn 
                ON c.country_code = cn.country_code
            LEFT JOIN estatus.apostolates_mst a 
                ON c.apostolate_code = a.apostolate_code
            WHERE c.centre_code = $1;
        `;
        
        const centreResult = await client.query(centreQuery, [centrecode]);

        if (centreResult.rows.length === 0) {
            return { error: "Centre not found" };
        }

        const centre = centreResult.rows[0];

        // Fetch Confrere List with Contact & Designation
        const confrereQuery = `
            SELECT 
                c.confrer_code, 
                TRIM(REPLACE(CONCAT_WS(' ', 
                    REPLACE(c.first_name, E'\t', ''), 
                    REPLACE(c.middle_name, E'\t', ''), 
                    REPLACE(c.last_name, E'\t', '')), '  ', ' ')) AS full_name,
                CONCAT(c.personal1_isd, ' ', c.personal1_contact_no) AS personal_contact,
                CONCAT(c.watsup1_isd, ' ', c.watsup1_no) AS whatsapp_contact,
                c.personal_mailid1 AS email,
                q.quickcode_name AS designation_name
            FROM estatus.appoint_transfer_dtl a
            JOIN estatus.confreres_dtl c 
                ON a.confrer_code = c.confrer_code
            LEFT JOIN estatus.quickcode_mst q 
                ON a.designation_code = q.quick_code 
                AND q.quick_code_type = 'destyp'
            WHERE a.centre_code = $1;
        `;
        
        const confrereResult = await client.query(confrereQuery, [centrecode]);
        const confrereList = confrereResult.rows.map(confrere => ({
            ...confrere,
            personal_contact: confrere.personal_contact?.trim() || null,
            whatsapp_contact: confrere.whatsapp_contact?.trim() || null
        }));

        // Fetch Confrer Data with Designation Name
        const confrerDataQuery = `
            SELECT 
                a.*, 
                q.quickcode_name AS designation_name
            FROM estatus.appoint_transfer_dtl a
            LEFT JOIN estatus.quickcode_mst q 
                ON a.designation_code = q.quick_code 
                AND q.quick_code_type = 'destyp'
            WHERE a.centre_code = $1;
        `;
        
        const confrerDataResult = await client.query(confrerDataQuery, [centrecode]);
        const confrerDataList = confrerDataResult.rows;

        // **Return a structured JSON response with all necessary details**
        return {
            
                ...centre,  // Spread the `centre` object to include all fields directly
                address: [centre.address1, centre.address2, centre.address3].filter(Boolean).join(', '),  // Format address properly
                confreres: confrereList,
                confrer_data: confrerDataList
            
        };
    } catch (error) {
        console.error("Error fetching centre details:", error);
      
    }
};

module.exports = { findConfreres, findCentres, viewConfre, viewCentre, findScholastics,viewScholastic};
