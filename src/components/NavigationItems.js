import React, { Fragment, useState, useContext, useEffect } from 'react';
import { css } from '@emotion/core';
import usePrevious from '../hooks/usePrevious';
import PropTypes from 'prop-types';
import FeatherIcon from './FeatherIcon';
import NewRelicIcon from './NewRelicIcon';
import { Link } from 'gatsby';
import cx from 'classnames';
import { BreadcrumbContext } from './BreadcrumbContext';
import styles from './NavigationItems.module.scss';
import { link } from '../types';
import { useLocation } from '@reach/router';

const iconLibrary = {
  'Collect data': 'collectData',
  'Build apps': 'buildApps',
  'Automate workflows': 'automation',
  'Explore docs': 'developerDocs',
  'Developer champions': 'developerChampions',
  Podcasts: 'podcasts',
  'Try our APIs': 'tryOurAPIs',
};

const normalizeUrl = (url) => url?.replace(/\/$/, '');

const getHighlightedText = (text, highlight) => {
  const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
  return (
    <span>
      {parts.map((part) =>
        part.toLowerCase() === highlight.toLowerCase() ? <b>{part}</b> : part
      )}
    </span>
  );
};

const isExternal = (url) => url.slice(0, 4) === 'http';

const NavigationItems = ({
  pages,
  filteredPageNames,
  searchTerm,
  depthLevel = 0,
}) => {
  const groupedPages = pages.reduce((groups, page) => {
    const { group = '' } = page;

    return {
      ...groups,
      [group]: [...(groups[group] || []), page],
    };
  }, {});

  return Object.entries(groupedPages).map(([group, pages]) => {
    const showGroup =
      (group && !filteredPageNames) ||
      (group &&
        filteredPageNames &&
        pages.some((el) => filteredPageNames.includes(el.displayName)));

    return (
      <Fragment key={group}>
        {showGroup && (
          <li className={cx(styles.navLink, styles.groupName)}>{group}</li>
        )}
        {pages.map((page, index) =>
          filteredPageNames?.includes(page.displayName) ||
          !filteredPageNames ? (
            <NavItem
              page={page}
              depthLevel={depthLevel}
              searchTerm={searchTerm}
              filteredPageNames={filteredPageNames}
              key={index}
            />
          ) : null
        )}
      </Fragment>
    );
  });
};

const NavIcon = ({ page }) => {
  if (iconLibrary[page.displayName]) {
    return (
      <NewRelicIcon
        className={styles.headerIcon}
        name={iconLibrary[page.displayName]}
      />
    );
  }

  return null;
};

const NavItem = ({ page, depthLevel, searchTerm, filteredPageNames }) => {
  const location = useLocation();
  const crumbs = useContext(BreadcrumbContext).flatMap((x) => x.displayName);
  const isHomepage = location.pathname === '/';
  const isBreadCrumb = crumbs.includes(page.displayName);
  const matchesSearch = filteredPageNames?.includes(page.displayName);
  const hasChangedPage = location.pathname !== usePrevious(location.pathname);
  const shouldExpand = (isHomepage && depthLevel === 0) || isBreadCrumb;
  const [toggleIsExpanded, setToggleIsExpanded] = useState(shouldExpand);
  const isExpanded = toggleIsExpanded || matchesSearch;

  useEffect(() => {
    if (hasChangedPage) {
      setToggleIsExpanded(shouldExpand);
    }
  }, [hasChangedPage, shouldExpand]);

  const isCurrentPage =
    normalizeUrl(location.pathname) === normalizeUrl(page.url);

  const isToggleable = [
    'Component library',
    'Explore docs',
    'Try our APIs',
    'New Relic One CLI',
  ].includes(page.displayName);
  const headerIcon = depthLevel === 0 && <NavIcon page={page} />;
  const display = filteredPageNames
    ? getHighlightedText(page.displayName, searchTerm)
    : page.displayName;

  return (
    <>
      <div
        key={page.displayName}
        data-depth={depthLevel}
        className={cx({ [styles.filterOn]: filteredPageNames })}
        css={css`
          padding-left: ${depthLevel === 0 ? '0' : 'calc(0.5rem + 1em)'};

          ${depthLevel === 0 &&
          css`
            &:not(:first-child) {
              margin-top: 1rem;
            }
          `}
        `}
      >
        {page.url ? (
          <Link
            partiallyActive
            onClick={
              isToggleable ? () => setToggleIsExpanded(!toggleIsExpanded) : null
            }
            className={cx(styles.navLink, {
              [styles.isCurrentPage]: isCurrentPage,
              [styles.isPartiallyCurrent]: isBreadCrumb && !isCurrentPage,
            })}
            to={page.url}
          >
            <span className={styles.navLinkText}>
              {headerIcon}
              {display}
            </span>
            {page.children && (
              <FeatherIcon
                size="1rem"
                className={cx(
                  { [styles.isExpanded]: isExpanded },
                  styles.nestedChevron
                )}
                name="chevron-right"
              />
            )}
            {isExternal(page.url) && <FeatherIcon name="external-link" />}
          </Link>
        ) : (
          <div
            role="button"
            css={css`
              cursor: pointer;
            `}
            className={cx(styles.navLink, {
              [styles.isPartiallyCurrent]: isBreadCrumb,
            })}
            onClick={() => setToggleIsExpanded(!toggleIsExpanded)}
            onKeyPress={() => setToggleIsExpanded(!toggleIsExpanded)}
            tabIndex={0}
          >
            <span className={styles.navLinkText}>
              {headerIcon}
              {display}
            </span>
            <FeatherIcon
              size="1rem"
              className={cx(
                { [styles.isExpanded]: isExpanded },
                styles.nestedChevron
              )}
              name="chevron-right"
            />
          </div>
        )}

        {page.children && isExpanded && (
          <NavigationItems
            pages={page.children}
            filteredPageNames={filteredPageNames}
            depthLevel={depthLevel + 1}
            searchTerm={searchTerm}
          />
        )}
      </div>
    </>
  );
};

NavIcon.propTypes = {
  page: PropTypes.shape({
    displayName: PropTypes.string.isRequired,
  }),
};

NavigationItems.propTypes = {
  pages: PropTypes.array.isRequired,
  filteredPageNames: PropTypes.array,
  searchTerm: PropTypes.string,
  depthLevel: PropTypes.number,
};

NavItem.propTypes = {
  page: link,
  filteredPageNames: PropTypes.array,
  searchTerm: PropTypes.string,
  depthLevel: PropTypes.number.isRequired,
};

export default NavigationItems;
