import React from "react";
import { Grid, Paper, Typography, Icon, ListItem, CircularProgress,
  Button, useMediaQuery, Switch, FormControlLabel, Popover, IconButton }
  from "@material-ui/core";
import { withStyles, makeStyles, useTheme } from '@material-ui/core/styles';
import ReactMarkdown from 'react-markdown';
import { FixedSizeList as VirtualizedList } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import { Helmet } from "react-helmet";

import { ANILIST_BASE_URL, CHARACTERS_QUERY, STAFF_QUERY, APP_NAME } from "../common";
import { ErrorSnackbar } from "../components/messageSnackbar";
import { DropDownMenu } from "../components/dropdown.js";
import { ElidedText } from "../components/elidedtext.js";

// used for testing/debugging
const cachedFetch = (url, options) => {
  let cacheKey = url + options.body;

  let cached = sessionStorage.getItem(cacheKey)
  if (cached !== null) {
    let response = new Response(new Blob([cached]))
    return Promise.resolve(response)
  }

  return fetch(url, options).then(response => {
    if (response.status === 200) {
      let ct = response.headers.get('Content-Type')
      if (ct && (ct.match(/application\/json/i) || ct.match(/text\//i))) {
        response.clone().text().then(content => {
          sessionStorage.setItem(cacheKey, content)
        })
      }
    }
    return response
  })
}


const styles = theme => ({
  root: {
    flexGrow: 1,
  },
  descPaper: {
    padding: theme.spacing(2),
  },
  listPaper: {
    padding: theme.spacing(1),
    height: '80vh',
    display: 'flex',
    flexDirection: 'column',
    [theme.breakpoints.down('xs')]: {
      height: '100vh',
      display: 'block',
      overflowX: 'hidden',
    },
  },
  item: {
    padding: theme.spacing(0.5),
    [theme.breakpoints.down('xs')]: {
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
    [theme.breakpoints.down('xs')]: {
      height: '240px',
      maxHeight: '240px',
      paddingLeft: '0px',
      paddingRight: '0px',
    },
  },
  listContainer: {
    flex: '1 1 auto',
    [theme.breakpoints.down('xs')]: {
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
  },
  descriptionCompact: {
    maxHeight: '100vh',
    overflowY: 'hidden',
  },
  descriptionExpanded: {
  },
  popover: {
    [theme.breakpoints.up('sm')]: {
      minWidth: '600px',
    }
  },
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
  if (!season && !year) {
    return 'Unknown';
  }
  if (!season) {
    return year;
  }

  return capitalizeWord(season) + ' ' + year;
}

const seasonInt = (m) => {
  if (m.status == 'NOT_YET_RELEASED') {
    return Number.MAX_SAFE_INTEGER;
  }

  if (!m.startDate.year) {
    return 0;
  }

  return m.startDate.year * 100 + (m.startDate.month || 0);
}


const formatDiscriptionText = (description) => {
  // Convert single newlines to '/n  ' which is a line break in markdown.
  // Leave double newlines as is, which are paragraph breaks.
  return description.replace(/\n(?!\n)/g, '  \n');
}

const sortByKey = (arr, sort_key, order_int = 1) => {
  arr.sort((a, b) => {
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
}

const flattenCharacter = (character) => character.media.map(m => {
  const char_copy = { ...character, ...m };
  delete char_copy.media;
  return char_copy;
});  

class UnstyledSeiyuuDescription extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      expand: false,
      overflow: false,
    };
    this.containerRef = React.createRef();
  }

  componentDidMount() {
    this.setState({
      overflow: this.containerRef.current.offsetHeight < this.containerRef.current.scrollHeight
    });
  }

  toggleExpand() {
    this.setState({
      expand: !this.state.expand,
    });
  }

  render() {
    const containerClass = this.state.expand ? 'descriptionExpanded' : 'descriptionCompact';
    const classes = this.props.classes;
    return (
      <>
        <div className={classes[containerClass]} ref={this.containerRef}>
          <div style={{textAlign: 'center'}}><img src={this.props.image} style={{maxWidth: "80%"}} alt="Seiyuu"/></div>

          <Typography variant="h4">{this.props.name}</Typography>

          <div style={{display: 'flex', justifyContent: 'space-between'}}>
            <a className={classes.link} href={this.props.url} target="_blank"><Typography variant="body2"><u>Anilist</u></Typography></a>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Icon style={{color: "red"}}>favorite</Icon> &nbsp;
              <Typography variant="body2">{this.props.favorites}</Typography>
            </div>
          </div>

          <div className={classes.markdownContainer}>
            <ReactMarkdown source={formatDiscriptionText(this.props.description)} />
          </div>
        </div>
        <div style={{textAlign: 'center'}}>
          <Button
            size="small"
            style={{margin: 'auto', display: this.state.overflow ? 'block': 'none'}}
            onClick={() => this.toggleExpand()}>
              {this.state.expand ? "Collapse" : "More"}
          </Button>
        </div>
      </>);
  }
}

const SeiyuuDescription = withStyles(styles)(UnstyledSeiyuuDescription);

// PureComponent helps with (scrolling) performance
class UnstyledCharacterItem extends React.PureComponent {
  render() {
    const {index, style, data} = this.props;
    const role = data.characters[index];
    const fold = data.fold;
    const classes = this.props.classes;

    const Character = () => (
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
      </Grid>);

    const AnimeFlattened = (props) => (
      <Grid container item sm={6} justify="flex-end" className={classes.item} style={{textAlign: 'right'}}>
        <Grid item xs={10} className={classes.item}>
          <Typography variant="body1">
            <a className={classes.link} href={props.d.media_url} target='_blank'>
              <ElidedText maxLength={80}>{props.d.media_title}</ElidedText>
            </a>
          </Typography>
          <Typography variant="body2">
            {props.d.media_season}
          </Typography>
          <Typography variant="body2">
            <b>Score</b>: {props.d.media_score} &nbsp;
            <b>Popularity</b>: {props.d.media_popularity} &nbsp;
          </Typography>
        </Grid>
        <Grid item xs={2} className={classes.item}>
          <img src={props.d.media_image} alt="media" className={classes.itemImage}/>
        </Grid>
      </Grid>
    );

    const AnimeFolded = () => (
      <Grid container item sm={6} justify="flex-end" className={classes.item} style={{textAlign: 'right'}}>
        <Grid item xs={10} className={classes.item}>
          <Typography variant="body1">
            <a className={classes.link} href={role.media[0].media_url} target='_blank'>
              <ElidedText maxLength={80}>{role.media[0].media_title}</ElidedText>
            </a>
          </Typography>
          <Typography variant="button">Open {role.media.length - 1} more title{role.media.length > 2 && 's'}</Typography>
        </Grid>
        <Grid item xs={2} className={classes.item}>
          <img src={role.media[0].media_image} alt="media" className={classes.itemImage}/>
        </Grid>
      </Grid>
    );

    let Anime = null;
    const buttonProps = {};
    if (fold) {
      if (role.media.length > 1) {
        Anime = AnimeFolded;
        buttonProps.button = true;
        buttonProps.onClick = (event) => data.openPopover(event.currentTarget, index);
      } else {
        Anime = () => <AnimeFlattened d={role.media[0]} />;
      }
    } else {
      Anime = () => <AnimeFlattened d={role} />;
    }

    return (
      <div style={style}>
        <ListItem divider={index < data.characters.length - 1} className={classes.listItem} {...buttonProps}>
          <Grid container>
            <Character />
            <Anime />
          </Grid>
        </ListItem>
      </div>
    );
  }
}

const CharacterItem = withStyles(styles)(UnstyledCharacterItem);

const CharacterList = (props) => {
  const theme = useTheme();
  const classes = makeStyles(styles)();
  const itemSize = useMediaQuery(theme.breakpoints.down('xs')) ? 240 : 120;
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [popoverIndex, setPopoverIndex] = React.useState(0);

  const openPopover = (anchor, index) => {
    setAnchorEl(anchor);
    setPopoverIndex(index);
  };

  const PopoverContent = ({character}) => {
    const subList = flattenCharacter(character);
    return (
      <>
        <div style={{ textAlign: 'right' }}>
          <IconButton aria-label="close" onClick={() => setAnchorEl(null)}><Icon>close</Icon></IconButton>
        </div>
        <div style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 100px)' }}>
          {subList.map((c, i) => <CharacterItem key={i} index={i} data={{characters: subList, fold: false, openPopover: null}} />)}
        </div>
      </>
    );
  };
  
  return (
    <>
      <AutoSizer>
        {({ height, width }) => (
          <VirtualizedList
            height={height}
            itemCount={props.characters.length}
            itemSize={itemSize}
            width={width}
            itemData={{characters: props.characters, fold: props.fold, openPopover}}
          >
            {CharacterItem}
          </VirtualizedList>
        )}
      </AutoSizer>
      <Popover
        classes={{paper: classes.popover}}
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'center',
          horizontal: 'center',
        }}
      >
        <PopoverContent character={props.characters[popoverIndex]} />
      </Popover>
    </>
  );
};

const sortKeys = {
  'name': 'Character Name',
  'favorites': 'Character Favorites',
  'media_title': 'Anime Name',
  'media_score': 'Anime Score',
  'media_season_int': 'Anime Release Date',
  'media_popularity': 'Anime Popularity',
};
const sortKeysFolded = {
  'name': 'Character Name',
  'favorites': 'Character Favorites',
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

      fold_roles: false,
      sort_key: Object.keys(sortKeys)[0],
      sort_order: Object.keys(sortOrders)[0],
      filter_char_type: Object.keys(filterCharacterType)[0],
      filter_status: Object.keys(mediaStatus)[0],

      snackbar_open: false,
      snackbar_message: '',
    };
  }

  async fetchList(page) {
    // FIXME
    const response = await cachedFetch(ANILIST_BASE_URL, {
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
    const characters = data['characters']['edges'].map(e => {
      const media = e['media'].map(m => {
        if (m['type'] === 'ANIME') {
          return {
            media_score: toFixedNumber((m['averageScore'] || 0) / 10),
            media_title: m['title']['romaji'],
            media_season: joinSeason(m['season'], m['startDate']['year']),
            media_season_int: seasonInt(m),
            media_image: m['coverImage']['medium'],
            media_popularity: m['popularity'] || 0,
            media_url: m['siteUrl'],
            media_status: capitalizeSentence(m['status']),
          };
        }
      });
      sortByKey(media, 'media_season_int');
      return {
        id: e['node']['id'],
        role: capitalizeWord(e['role']) || '',
        favorites: e['node']['favourites'] || 0,
        image: e['node']['image']['medium'],
        name: e['node']['name']['full'],
        url: e['node']['siteUrl'],
        media,
      };
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

    const sorted = this.prepareView(this.state, this.characters);
    this.setState({
      characters_view: sorted,
      is_loading: false,
    });

  }

  async fetchStaff() {
    // FIXME
    const response = await cachedFetch(ANILIST_BASE_URL , {
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
      (state.fold_roles || state.filter_status == 'All' || state.filter_status == c.media_status)
    ));
  }

  prepareView(state, characters) {
    let copy = [];
    if (state.fold_roles) {
      copy = characters.slice();
    } else {
      copy = [].concat(...characters.map(flattenCharacter));
    } 

    const order_int = (state.sort_order === 'asc') ? 1 : -1;
    sortByKey(copy, state.sort_key, order_int);
    return this.filter(state, copy);
  }

  changeView(new_state) {
    let state = {
      fold_roles: this.state.fold_roles,
      sort_key: this.state.sort_key,
      sort_order: this.state.sort_order,
      filter_char_type: this.state.filter_char_type,
      filter_status: this.state.filter_status,
      ...new_state
    };

    if ('fold_roles' in new_state && new_state.fold_roles && !(state.sort_key in sortKeysFolded)) {
      new_state.sort_key = state.sort_key = Object.keys(sortKeysFolded)[0];
    }

    let characters_view = this.prepareView(state, this.characters);
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

    const Controls = () => (
      <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', alginItems: 'center' }}>
        <FormControlLabel
          control={<Switch size="small" />}
          onChange={e => this.changeView({ 'fold_roles': e.target.checked })}
          checked={this.state.fold_roles}
          label={<Typography variant="caption" component="span">Fold duplicate characters into one</Typography>}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-begin', alignItems: 'center' }}>
          <Typography variant="caption" component="span">Filter by:</Typography>
          <DropDownMenu 
              onChange={f => this.changeView({ 'filter_char_type': f })}
              selectedKey={this.state.filter_char_type}
              keys={filterCharacterType}
          />
          {this.state.fold_roles ||
            <DropDownMenu
                onChange={f => this.changeView({ 'filter_status': f })}
                selectedKey={this.state.filter_status}
                keys={mediaStatus}
            />}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <Typography variant="caption" component="span">Sort by:</Typography>
          <DropDownMenu
              onChange={key => this.changeView({ 'sort_key': key })}
              selectedKey={this.state.sort_key}
              keys={this.state.fold_roles ? sortKeysFolded : sortKeys}
          />
          <DropDownMenu
              onChange={order => this.changeView({ 'sort_order': order })}
              selectedKey={this.state.sort_order}
              keys={sortOrders}
          />
        </div>
      </div>
      </>
    );

    const PageGrid = () => <Grid container spacing={2}>
      <Grid item sm={3}>
        <Paper className={classes.descPaper}>
          <SeiyuuDescription
            image={this.state.image}
            name={this.state.name}
            favorites={this.state.favorites}
            url={this.state.anilistUrl}
            description={this.state.description} />
        </Paper>
      </Grid>
      <Grid item sm={9}>
        <Paper className={classes.listPaper}>
          <Controls />
          <div className={classes.listContainer}>
            <CharacterList characters={this.state.characters_view} fold={this.state.fold_roles} />
          </div>
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