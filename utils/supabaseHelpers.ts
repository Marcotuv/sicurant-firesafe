
/**
 * Helper to fetch ALL records from a Supabase query by automatically handling pagination.
 * Supabase limits default queries to 1000 rows. This utility pages through until all data is retrieved.
 * Includes rate limiting and retry logic to prevent ERR_INSUFFICIENT_RESOURCES errors.
 */
export async function fetchAll<T>(
    queryBuilder: any,
    batchSize: number = 1000
): Promise<{ data: T[] | null; error: any }> {
    let allData: T[] = [];
    let page = 0;
    const maxRetries = 3;
    const baseDelay = 150; // ms between requests

    while (true) {
        const from = page * batchSize;
        const to = (page + 1) * batchSize - 1;

        let attempt = 0;
        let success = false;
        let data: any = null;
        let error: any = null;

        // Retry logic with exponential backoff
        while (attempt < maxRetries && !success) {
            try {
                const result = await queryBuilder.range(from, to);
                data = result.data;
                error = result.error;

                if (error) {
                    // Check if it's a rate limit or resource error
                    if (error.message?.includes('INSUFFICIENT_RESOURCES') || error.code === 'PGRST301') {
                        throw new Error('Rate limit hit');
                    }
                    return { data: null, error };
                }

                success = true;
            } catch (err: any) {
                attempt++;
                if (attempt < maxRetries) {
                    const backoffDelay = baseDelay * Math.pow(2, attempt);
                    console.warn(`[fetchAll] Retry ${attempt}/${maxRetries} after ${backoffDelay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, backoffDelay));
                } else {
                    console.error('[fetchAll] Max retries reached:', err);
                    return { data: null, error: err };
                }
            }
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

        // Add delay between pages to avoid overwhelming Supabase
        if (page > 0) {
            await new Promise(resolve => setTimeout(resolve, baseDelay));
        }
    }

    return { data: allData, error: null };
}
