import React from "react"
import { Grid, Paper, Typography, Icon, List, ListItem, CircularProgress,
  Button, Menu, MenuItem, Grow }
  from "@material-ui/core"
import { withStyles, makeStyles, useTheme } from '@material-ui/core/styles';
import ReactMarkdown from 'react-markdown'
import { FixedSizeList as VirtualizedList } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import { withWidth } from "@material-ui/core"

import { ANILIST_BASE_URL, CHARACTERS_QUERY, STAFF_QUERY } from "../common";

const styles = theme => ({
  root: {
    flexGrow: 1,
  },
  descPaper: {
    padding: theme.spacing(2),
  },
  listPaper: {
    padding: theme.spacing(1),
    [theme.breakpoints.up('md')]: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    },
    [theme.breakpoints.down('md')]: {
      height: '100vh',
      display: 'block',
      overflowX: 'hidden',
    },
  },
  item: {
    padding: theme.spacing(0.5),
  },
  itemImage: {
    display: 'block',
    maxWidth: '100%',
    maxHeight: '100%',
    margin: 'auto'
  },
  itemRight: {
    textAlign: 'right'
  },
  centerFlex: {
    display: 'flex',
    alignItems: 'center'
  },
  markdownContainer: {
    fontSize: '0.875rem'
  },
  listLoader: {
    display: 'flex',
    justifyContent: 'center',
    height: '100%',
    alignItems: 'center',
  },
  listItem: {
    [theme.breakpoints.up('md')]: {
      height: 120,
    },
    [theme.breakpoints.down('md')]: {
      height: 120*2,
    },
  },
  listContainer: {
    [theme.breakpoints.up('md')]: {
      flex: '1 1 auto',
    },
    [theme.breakpoints.down('md')]: {
      height: '100%',
    },
  }
});

const capitalizeWord = (word) => {
  if (word.length)
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  return word;
}

const SeiyuuDescription = (props) => {
  const classes = makeStyles(styles)();

  return (
    <>
      <img src={props.image} width="100%" alt="Seiyuu"/>

      <Typography variant="h4">{props.name}</Typography>

      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Icon fontSize="small">favorite</Icon> &nbsp;
        <Typography variant="body2">{props.favorites}</Typography>
      </div>

      <div className={classes.markdownContainer}>
        <ReactMarkdown source={props.description} />
      </div>
    </>)
}

const CharacterItem = (props) => {
  const classes = makeStyles(styles)();

  return (
    <ListItem divider={props.divider} className={classes.listItem}>
      <Grid container>
        <Grid container item md={6} justify="flex-start" className={classes.item}>
          <Grid item xs={2} className={classes.item}>
            <img src={props.image} alt="character" className={classes.itemImage}/>
          </Grid>
          <Grid item xs={10} className={classes.item}>
            <Typography variant="body1">{props.name}</Typography>
            <Typography variant="body2">{props.role}</Typography>
            <div className={classes.centerFlex}>
              <Icon style={{fontSize: "0.875rem"}}>favoriteBorder</Icon> &nbsp;
              <Typography variant="body2" style={{fontSize: "0.875rem"}}>{props.favorites}</Typography>
            </div>
          </Grid>
        </Grid>
        <Grid container item md={6} justify="flex-end" className={classes.item} style={{textAlign: 'right'}}>
          <Grid item xs={10} className={classes.item}>
            <Typography variant="body1">{props.mediaTitle}</Typography>
            <Typography variant="body2">{props.mediaYear}</Typography>
            <Typography variant="body2">Score: {props.mediaScore}</Typography>
          </Grid>
          <Grid item xs={2} className={classes.item}>
            <img src={props.mediaImage} alt="media" className={classes.itemImage}/>
          </Grid>
        </Grid>
      </Grid>
    </ListItem>
  )
}

const Row = ({ index, style, data }) => {
  const c = data[index];
  return (
    <div style={style}>
      <CharacterItem
        key={c.id}
        role={c.role}
        image={c.image}
        name={c.name}
        favorites={c.favorites}
        mediaTitle={c.media_title}
        mediaScore={c.media_score}
        mediaYear={c.media_year}
        mediaImage={c.media_image}
        divider={index < data.length - 1} />
    </div>
  );
}

const CharacterList = withWidth()((props) => {
  const theme = useTheme();
  const itemSize = props.width > theme.breakpoints.width('md') ? 120 : 240;

  return (
      <AutoSizer>
        {({ height, width }) => (
          <VirtualizedList
            height={height}
            itemCount={props.data.length}
            itemSize={240}
            width={width}
            itemData={props.data}
          >
            {Row}
          </VirtualizedList>
        )}
      </AutoSizer>
  );
});

const sortKeys = {
  'name': 'Character Name',
  'favorites': 'Character Favorites',
  'media_title': 'Anime Name',
  'media_score': 'Anime Score',
  'media_year': 'Anime Release Year',
};
const sortOrders = {
  'asc': 'Ascending',
  'desc': 'Descending',
};

const SortMenu = (props) => {
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClick = (event, key) => {
    setAnchorEl(null);
    props.onChange(key);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <Button
        aria-controls="sort-by"
        aria-haspopup="true"
        onClick={handleOpen}
        endIcon={<Icon>expand_more</Icon>}
        style={{textTransform: 'none'}}
      >
        {props.keys[props.selectedKey]}
      </Button>
      <Menu
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        {Object.entries(props.keys).map(([key, text]) =>
          <MenuItem
            key={key}
            selected={key === props.selectedKey}
            onClick={event => handleClick(event, key)}>
              {text}
          </MenuItem>
        )}
      </Menu>
    </>
  );
}

class UnstyledSeiyuu extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      id: this.props.match.params.id,
      name: 'Loading...',
      favorites: 0,
      image: '',
      description: 'Loading...',
      anilistUrl: '#',
      characters: [],
      is_loading: true,
      sort_key: Object.keys(sortKeys)[0],
      sort_order: Object.keys(sortOrders)[0],
    };
  }

  async fetchList(page) {
    console.log(`Fetching page ${page}`);
    const response = await fetch(ANILIST_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query: CHARACTERS_QUERY,
        variables: {
          id: parseInt(this.state.id),
          page: page,
          perPage: 50
        }
      })
    });
    const reply = await response.json();
    console.log(`Fetched page ${page}`);
    console.log(reply);
    const data = reply['data']['Staff']
    console.assert(data['id'] === this.state.id);
    const characters = data['characters']['edges'].map(e => (
      {
        id: e['node']['id'],
        role: capitalizeWord(e['role']),
        favorites: e['node']['favourites'],
        image: e['node']['image']['medium'],
        name: e['node']['name']['full'],
        media_score: e['node']['media']['nodes'][0]['averageScore'],
        media_title: e['node']['media']['nodes'][0]['title']['romaji'],
        media_year: e['node']['media']['nodes'][0]['seasonYear'],
        media_image: e['node']['media']['nodes'][0]['coverImage']['medium']
      }
    ));
    return characters;
  }

  async fetchFullList(total_pages) {
    console.log(`Fetching ${total_pages} pages`);
    const promises = [];
    for (let page = 1; page <= total_pages; ++page) {
      promises.push(this.fetchList(page));
    }
    const character_lists = await Promise.all(promises);
    const characters = this.sortCharacters(this.state.sort_key, this.state.sort_order,
                                            [].concat.apply([], character_lists));

    this.setState({
      characters: characters,
      is_loading: false,
    });

    console.log(this.state);
  }

  async fetchStaff() {
    const response = await fetch(ANILIST_BASE_URL , {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query: STAFF_QUERY,
        variables: {
          id: parseInt(this.state.id),
        }
      })
    });
    const reply = await response.json();
    console.log(reply);
    const data = reply['data']['Staff'];
    this.setState({
      id: data['id'],
      name: data['name']['full'],
      favorites: data['favourites'],
      image: data['image']['large'],
      description: data['description'],
      anilistUrl: data['siteUrl'],
    });
    
    let total_pages = data['characters']['pageInfo']['lastPage'];
    await this.fetchFullList(total_pages);
  }

  componentDidMount() {
    this.fetchStaff()
  }

  sortCharacters(sort_key, order, characters) {
    const order_int = (order === 'asc') ? 1 : -1;
    console.log("Start sorting");
    characters.sort((a, b) => {
      let a_key = a[sort_key];
      let b_key = b[sort_key];
      if (a_key < b_key) {
        return -order_int;
      }
      if (a_key > b_key) {
        return +order_int;
      }
      return 0;
    });
    console.log("End sorting")
    return characters;
  }

  changeOrder(sort_order) {
    if (sort_order in sortOrders) {
      console.log(`Set order ${sort_order}`);

      const characters = this.sortCharacters(this.state.sort_key, sort_order, this.state.characters);
      this.setState({
        sort_order,
        characters
      })
    } else {
      console.error(`changeOrder: ${sort_order} not in sortOrders`);
    }
  }
  changeKey(sort_key) {
    if (sort_key in sortKeys) {
      console.log(`Set sort_key ${sort_key}`);

      const characters = this.sortCharacters(sort_key, this.state.sort_order, this.state.characters);
      this.setState({
          sort_key,
          characters,
      });
    } else {
      console.error(`changeKey: ${sort_key} not in sortKeys`);
    }
  }

  render() {
    const classes = this.props.classes;
    const PageGrid = () => <Grid container spacing={2}>
      <Grid item md={3}>
        <Paper className={classes.descPaper}>
          <SeiyuuDescription image={this.state.image} name={this.state.name}
            favorites={this.state.favorites} description={this.state.description} />
        </Paper>
      </Grid>
      <Grid item md={9}>
        <Paper className={classes.listPaper}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
            <Typography variant="body2" component="span">Sort by: </Typography>
            <SortMenu onChange={key => this.changeKey(key)} selectedKey={this.state.sort_key} keys={sortKeys} />
            <SortMenu onChange={order => this.changeOrder(order)} selectedKey={this.state.sort_order} keys={sortOrders} />
          </div>
          <div className={classes.listContainer}><CharacterList data={this.state.characters} /></div>
        </Paper>
      </Grid>
    </Grid>;

    return (
      <div className={classes.root}>
        {this.state.is_loading ?
          <div className={classes.listLoader}><CircularProgress size={60} thickness={4} /></div> :
          <PageGrid />}
      </div>
    )
  }
}

export const Seiyuu = withStyles(styles)(UnstyledSeiyuu);