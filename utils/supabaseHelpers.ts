
/**
 * Helper to fetch ALL records from a Supabase query by automatically handling pagination.
 * Supabase limits default queries to 1000 rows. This utility pages through until all data is retrieved.
 */
export async function fetchAll<T>(
    queryBuilder: any,
    batchSize: number = 1000
): Promise<{ data: T[] | null; error: any }> {
    let allData: T[] = [];
    let page = 0;

    while (true) {
        const from = page * batchSize;
        const to = (page + 1) * batchSize - 1;

        // We clone the query builder if possible to avoid mutating state, 
        // though typically range() is chainable. 
        // Note: queryBuilder passed in should be the base query (e.g. supabase.from('x').select('*'))
        const { data, error } = await queryBuilder.range(from, to);

        if (error) {
            return { data: null, error };
        }

        if (!data || data.length === 0) {
            break;
        }

        allData = [...allData, ...data];

        // If we got fewer than batchSize, we are done
        if (data.length < batchSize) {
            break;
        }

        page++;
    }

    return { data: allData, error: null };
}
