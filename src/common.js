export const ANILIST_BASE_URL = 'https://graphql.anilist.co'

export const SEARCH_QUERY = `query ($search: String, $page: Int, $perPage: Int) {
    Page (page: $page, perPage: $perPage) {
        pageInfo {
            hasNextPage
            total
            lastPage
        }
        staff(search: $search) {
            id
            name {
                full
            }
            favourites
        		image	{
              medium
            }
        }
    }
}`;

export const STAFF_QUERY = `query ($id : Int) {
    Staff(id: $id) {
        id
        name {
            full
        }
        favourites
        image {
            large
        }
        description
        siteUrl
    }
}`;

export const CHARACTERS_QUERY = `query ($id: Int, $page: Int, $perPage: Int) {
    Staff(id: $id) {
        id
        characters(page: $page, perPage: $perPage) {
            pageInfo {
                hasNextPage
                total
                lastPage
            }
            edges {
                role
                node {
                    id
                    favourites
                    image {
                        medium
                    }
                    name {
                        full
                    }
                    media {
                        nodes {
                            averageScore
                            title {
                                romaji
                            }
                            seasonYear
                            coverImage {
                                medium
                            }
                        }
                    }
                }
            }
        }
    }
}`