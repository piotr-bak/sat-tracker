export async function fetchCelesTrakData(): Promise<string> {    
    const baseUrl = process.env.CELESTRAK_BASE_URL;

    if (!baseUrl) {
        throw new Error(
            'Failed to fetch CelesTrak data. CelesTrak base URL is not configured'
        );
    }
    
    const url = new URL(baseUrl);
    url.searchParams.set('GROUP', 'active');
    url.searchParams.set('FORMAT', 'csv');

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(
            `Failed to fetch CelesTrak data. Error ${response.status}: ${response.statusText}`
        )
    }

    return response.text();
}
