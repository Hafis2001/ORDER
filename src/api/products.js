export const fetchProducts = async (token, page = 1) => {
  try {
    const url = `https://gold.imcbs.com/api/products/?page=${page}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching products:', error);
    return null;
  }
};

// Fetches ALL pages from the paginated API and returns the full results array
export const fetchAllProducts = async (token) => {
  try {
    let allResults = [];
    let url = 'https://gold.imcbs.com/api/products/?page=1';

    while (url) {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`);
      }

      const data = await response.json();
      allResults = allResults.concat(data.results || []);

      // Move to next page, or stop if there is none
      url = data.next || null;
    }

    return allResults;
  } catch (error) {
    console.error('Error fetching all products:', error);
    return [];
  }
};
