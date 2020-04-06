import React from "react"
import { Grid, Paper, Typography, Icon, List, ListItem, CircularProgress,
  Button, Menu, MenuItem, Grow, Tooltip, useMediaQuery }
  from "@material-ui/core"
import { withStyles, makeStyles, useTheme } from '@material-ui/core/styles';
import ReactMarkdown from 'react-markdown'
import { FixedSizeList as VirtualizedList } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import { Helmet } from "react-helmet"
import { Link } from "react-router-dom"

import { ANILIST_BASE_URL, CHARACTERS_QUERY, STAFF_QUERY, APP_NAME } from "../common";
import { ErrorSnackbar } from "../components/messageSnackbar"

const styles = theme => ({
  root: {
    flexGrow: 1,
  },
  descPaper: {
    padding: theme.spacing(2),
  },
  listPaper: {
    padding: theme.spacing(1),
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    [theme.breakpoints.down('sm')]: {
      height: '100vh',
      display: 'block',
      overflowX: 'hidden',
    },
  },
  item: {
    padding: theme.spacing(0.5),
    [theme.breakpoints.down('sm')]: {
      padding: '1px',
    }
  },
  itemImage: {
    display: 'block',
    maxHeight: '100px',
    maxWidth: '100%',
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
    height: '120px',
    maxHeight: '120px',
    [theme.breakpoints.down('sm')]: {
      height: '240px',
      maxHeight: '240px',
      paddingLeft: '0px',
      paddingRight: '0px',
    },
  },
  listContainer: {
    flex: '1 1 auto',
    [theme.breakpoints.down('sm')]: {
      height: '100%',
    },
  },
  link: {
    textDecoration: 'none',
    color: 'blue',
    '&:link': {
      color: 'blue'
    },
    '&:visited': {
      color: 'blue'
    },
  }
});

const capitalizeWord = (word) => {
  if (!word)
    return '';
  if (word.length)
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  return word;
}

const capitalizeSentence = (sentence) => {
  if (!sentence) {
    return '';
  }
  return sentence.split(' ').map(capitalizeWord).join(' ');
}

const toFixedNumber = (n) => Number.parseFloat(n).toFixed(2)

const joinSeason = (season, year) => {
  if (!season || !year) {
    return 'Unknown';
  }

  return capitalizeWord(season) + ' ' + year;
}

const yearToSeasonInt = (n, status) => {
  if (status == 'NOT_YET_RELEASED') {
    return Number.MAX_SAFE_INTEGER;
  }
  if (!n) {
    return 0;
  }
  return 100 + n % 100;
}

const ElidedText = ({ children, maxLength }) => {
  let s = children;

  if (s.length >= maxLength) {
    s = s.substring(0, maxLength) + '...';
    return (
      <Tooltip title={children} interactive>
        <span>{s}</span>
      </Tooltip>
    )
  }

  return (
    <>
      {s}
    </>
  );
};

const formatDiscriptionText = (description) => {
  // Convert single newlines to '/n  ' which is a line break in markdown.
  // Leave double newlines as is, which are paragraph breaks.
  return description.replace(/\n(?!\n)/g, '  \n');
}

const SeiyuuDescription = (props) => {
  const classes = makeStyles(styles)();

  return (
    <>
      <div style={{textAlign: 'center'}}><img src={props.image} style={{maxWidth: "80%"}} alt="Seiyuu"/></div>

      <Typography variant="h4">{props.name}</Typography>

      <div style={{display: 'flex', justifyContent: 'space-between'}}>
        <a className={classes.link} href={props.url} target="_blank"><Typography variant="body2"><u>Anilist</u></Typography></a>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Icon style={{color: "red"}}>favorite</Icon> &nbsp;
          <Typography variant="body2">{props.favorites}</Typography>
        </div>
      </div>

      <div className={classes.markdownContainer}>
        <ReactMarkdown source={formatDiscriptionText(props.description)} />
      </div>
    </>)
}

// PureComponent helps with (scrolling) performance
class UnstyledCharacterItem extends React.PureComponent {
  render() {
    const {index, style, data} = this.props;
    const role = data[index];
    const classes = this.props.classes;

    return (
      <div style={style}>
        <ListItem divider={index < data.length - 1} className={classes.listItem}>
          <Grid container>
            <Grid container item sm={6} justify="flex-start" className={classes.item}>
              <Grid item xs={2} className={classes.item}>
                <img src={role.image} alt="character" className={classes.itemImage}/>
              </Grid>
              <Grid item xs={10} className={classes.item}>
                <Typography variant="body1">
                  <a className={classes.link} href={role.url} target='_blank'>
                    <ElidedText maxLength={80}>{role.name}</ElidedText>
                  </a>
                </Typography>
                <Typography variant="body2">{role.role}</Typography>
                <div className={classes.centerFlex}>
                  <Icon style={{fontSize: "0.875rem"}}>favorite</Icon> &nbsp;
                  <Typography variant="body2" style={{fontSize: "0.875rem"}}>{role.favorites}</Typography>
                </div>
              </Grid>
            </Grid>
            <Grid container item sm={6} justify="flex-end" className={classes.item} style={{textAlign: 'right'}}>
              <Grid item xs={10} className={classes.item}>
                <Typography variant="body1">
                  <a className={classes.link} href={role.media_url} target='_blank'>
                    <ElidedText maxLength={80}>{role.media_title}</ElidedText>
                  </a>
                </Typography>
                <Typography variant="body2">
                  {role.media_season}
                </Typography>
                <Typography variant="body2">
                  <b>Score</b>: {role.media_score} &nbsp;
                  <b>Popularity</b>: {role.media_popularity} &nbsp;
                </Typography>
              </Grid>
              <Grid item xs={2} className={classes.item}>
                <img src={role.media_image} alt="media" className={classes.itemImage}/>
              </Grid>
            </Grid>
          </Grid>
        </ListItem>
      </div>
    );
  }
}

const CharacterItem = withStyles(styles)(UnstyledCharacterItem);

const CharacterList = (props) => {
  const theme = useTheme();
  const itemSize = useMediaQuery(theme.breakpoints.down('sm')) ? 240 : 120;

  return (
      <AutoSizer>
        {({ height, width }) => (
          <VirtualizedList
            height={height}
            itemCount={props.data.length}
            itemSize={itemSize}
            width={width}
            itemData={props.data}
          >
            {CharacterItem}
          </VirtualizedList>
        )}
      </AutoSizer>
  );
};

const sortKeys = {
  'name': 'Character Name',
  'favorites': 'Character Favorites',
  'media_title': 'Anime Name',
  'media_score': 'Anime Score',
  'media_season_int': 'Anime Release Season',
  'media_popularity': 'Anime Popularity',
};
const sortOrders = {
  'asc': 'Ascending',
  'desc': 'Descending',
};
const filterCharacterType = {
  'All': 'All Roles',
  'Main': 'Main',
  'Supporting': 'Supporting',
};
const mediaStatus = {
  'All': 'All Status',
  'Finished': 'Finished',
  'Releasing': 'Airing',
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

    this.characters = [];
    this.state = {
      id: this.props.match.params.id,
      name: 'Loading...',
      favorites: 0,
      image: '',
      description: 'Loading...',
      anilistUrl: '#',
      characters_view: [],
      is_loading: true,
      sort_key: Object.keys(sortKeys)[0],
      sort_order: Object.keys(sortOrders)[0],
      filter_char_type: Object.keys(filterCharacterType)[0],
      filter_status: Object.keys(mediaStatus)[0],

      snackbar_open: false,
      snackbar_message: '',
    };
  }

  async fetchList(page) {
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
    const data = reply['data']['Staff']
    console.assert(data['id'] === this.state.id);
    const characters = [];
    data['characters']['edges'].forEach(e => {
      e['media'].forEach(m => {
        if (m['type'] === 'ANIME') {
          characters.push({
            id: e['node']['id'],
            role: capitalizeWord(e['role']) || '',
            favorites: e['node']['favourites'] || 0,
            image: e['node']['image']['medium'],
            name: e['node']['name']['full'],
            url: e['node']['siteUrl'],
            media_score: toFixedNumber((m['averageScore'] || 0) / 10),
            media_title: m['title']['romaji'],
            media_season: joinSeason(m['season'], m['seasonYear']),
            media_season_int: m['seasonInt'] || yearToSeasonInt(m['seasonYear'], m['status']),
            media_image: m['coverImage']['medium'],
            media_popularity: m['popularity'] || 0,
            media_url: m['siteUrl'],
            media_status: capitalizeSentence(m['status']),
          });
        }
      })
    });
    return characters;
  }

  async fetchFullList(total_pages) {
    const promises = [];
    for (let page = 1; page <= total_pages; ++page) {
      promises.push(this.fetchList(page));
    }
    const character_lists = await Promise.all(promises);
    this.characters = [].concat.apply([], character_lists);

    const sorted = this.sortFilterCharacters(this.state, this.characters);
    this.setState({
      characters_view: sorted,
      is_loading: false,
    });

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
    const data = reply['data']['Staff'];
    this.setState({
      id: data['id'],
      name: data['name']['full'],
      favorites: data['favourites'] || 0,
      image: data['image']['large'] || '',
      description: data['description'] || '',
      anilistUrl: data['siteUrl'] || '',
    });
    
    let total_pages = data['characters']['pageInfo']['lastPage'];
    await this.fetchFullList(total_pages);
  }

  componentDidMount() {
    try {
      this.fetchStaff()
    } catch (error) {
      console.error('fetch error', error);
      this.setState({
        snackbar_open: true,
        snackbar_message: "Fetching seiyuu data failed. Please try again or report.",
      });
    }
  }

  filter(state, characters) {
    return characters.filter(c => (
      (state.filter_char_type == 'All' || state.filter_char_type == c.role) &&
      (state.filter_status == 'All' || state.filter_status == c.media_status)
    ));
  }

  sortFilterCharacters(state, characters) {
    const order_int = (state.sort_order === 'asc') ? 1 : -1;
    const copy = characters.slice();
    copy.sort((a, b) => {
      let a_key = a[state.sort_key];
      let b_key = b[state.sort_key];
      if (a_key < b_key) {
        return -order_int;
      }
      if (a_key > b_key) {
        return +order_int;
      }
      return 0;
    });
    return this.filter(state, copy);
  }

  changeView(new_state) {
    let state = {
      sort_key: this.state.sort_key,
      sort_order: this.state.sort_order,
      filter_char_type: this.state.filter_char_type,
      filter_status: this.state.filter_status,
      ...new_state
    }
    let characters_view = this.sortFilterCharacters(state, this.characters);
    this.setState({
      characters_view,
      ...new_state
    });
  }

  setSnackbar(snackbar_open) {
    this.setState({ snackbar_open });
  }

  render() {
    const classes = this.props.classes;
    const PageGrid = () => <Grid container spacing={2}>
      <Grid item xs sm={3}>
        <Paper className={classes.descPaper}>
          <SeiyuuDescription
            image={this.state.image}
            name={this.state.name}
            favorites={this.state.favorites}
            url={this.state.anilistUrl}
            description={this.state.description} />
        </Paper>
      </Grid>
      <Grid item xs sm={9}>
        <Paper className={classes.listPaper}>
          <Grid container>
            <Grid item xs sm={6} style={{ display: 'flex', justifyContent: 'flex-begin', alignItems: 'center' }}>
              <Typography variant="body2" component="span">Filter by: </Typography>
              <SortMenu onChange={f => this.changeView({'filter_char_type': f})} selectedKey={this.state.filter_char_type} keys={filterCharacterType} />
              <SortMenu onChange={f => this.changeView({'filter_status': f})} selectedKey={this.state.filter_status} keys={mediaStatus} />
            </Grid>
            <Grid item xs sm={6} style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
              <Typography variant="body2" component="span">Sort by: </Typography>
              <SortMenu onChange={key => this.changeView({'sort_key': key})} selectedKey={this.state.sort_key} keys={sortKeys} />
              <SortMenu onChange={order => this.changeView({'sort_order': order})} selectedKey={this.state.sort_order} keys={sortOrders} />
            </Grid>
          </Grid>
          <div className={classes.listContainer}><CharacterList data={this.state.characters_view} /></div>
        </Paper>
      </Grid>
    </Grid>;

    return (
      <div className={classes.root}>
        <Helmet>
          <title>{!this.state.is_loading ? `${this.state.name} - ${APP_NAME}` : `${APP_NAME}`}</title>
        </Helmet>
        <ErrorSnackbar
          open={this.state.snackbar_open}
          message={this.state.snackbar_message}
          setOpen={open => this.setSnackbar(open)}
        />
        {this.state.is_loading ?
          <div className={classes.listLoader}><CircularProgress size={60} thickness={4} /></div> :
          <PageGrid />}
      </div>
    )
  }
}

export const Seiyuu = withStyles(styles)(UnstyledSeiyuu);