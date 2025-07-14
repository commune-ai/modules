# Pagination Fix Documentation

## Overview

This pagination fix provides a comprehensive solution for implementing pagination in your application. It supports multiple pagination strategies and can be easily integrated into any Python web framework.

## Features

- **Offset-based pagination**: Traditional page number pagination
- **Cursor-based pagination**: Efficient for large datasets
- **Flexible configuration**: Customizable page sizes and sorting
- **Framework agnostic**: Works with Flask, FastAPI, Django, etc.
- **Type-safe**: Uses dataclasses and type hints
- **API-ready**: Returns JSON-serializable responses

## Quick Start

### Basic Usage

```python
from pagination_fix import Paginator

# Your data
items = get_your_data()  # List of items

# Create paginator
paginator = Paginator()

# Paginate
result = paginator.paginate_dict(items, page=1, page_size=20)

# Use the result
print(result['data'])  # Paginated items
print(result['pagination'])  # Pagination metadata
```

### Flask Integration

```python
from flask import Flask, request, jsonify
from pagination_fix import Paginator, create_pagination_params

app = Flask(__name__)

@app.route('/api/items')
def get_items():
    # Get all items
    all_items = Item.query.all()
    
    # Get pagination params from request
    page = request.args.get('page', 1, type=int)
    page_size = request.args.get('page_size', 10, type=int)
    
    # Paginate
    paginator = Paginator()
    result = paginator.paginate_dict(all_items, page=page, page_size=page_size)
    
    return jsonify(result)
```

### FastAPI Integration

```python
from fastapi import FastAPI, Query
from pagination_fix import Paginator

app = FastAPI()

@app.get('/api/items')
async def get_items(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100)
):
    # Get all items
    all_items = await fetch_items()
    
    # Paginate
    paginator = Paginator()
    result = paginator.paginate_dict(all_items, page=page, page_size=page_size)
    
    return result
```

### Django Integration

```python
from django.http import JsonResponse
from pagination_fix import Paginator

def item_list(request):
    # Get all items
    all_items = list(Item.objects.all().values())
    
    # Get pagination params
    page = int(request.GET.get('page', 1))
    page_size = int(request.GET.get('page_size', 10))
    
    # Paginate
    paginator = Paginator()
    result = paginator.paginate_dict(all_items, page=page, page_size=page_size)
    
    return JsonResponse(result)
```

## Advanced Usage

### Cursor-based Pagination

```python
from pagination_fix import Paginator, CursorPagination

# Use cursor pagination for large datasets
paginator = Paginator(CursorPagination(cursor_field='id'))

# First page
result = paginator.paginate_dict(items, page_size=20)

# Next page using cursor
next_result = paginator.paginate_dict(
    items, 
    page_size=20, 
    cursor=result['pagination']['next_cursor']
)
```

### Custom Sorting

```python
result = paginator.paginate_dict(
    items,
    page=1,
    page_size=20,
    sort_by='created_at',
    sort_order='desc'
)
```

### Database Query Pagination

```python
from pagination_fix import paginate_query

# For SQLAlchemy queries
query = session.query(Item).filter(Item.active == True)
items, pagination_info = paginate_query(query, page=2, page_size=25)
```

## API Response Format

The paginator returns responses in this format:

```json
{
  "data": [
    {"id": 1, "name": "Item 1"},
    {"id": 2, "name": "Item 2"}
  ],
  "pagination": {
    "total_items": 100,
    "total_pages": 10,
    "current_page": 1,
    "page_size": 10,
    "has_next": true,
    "has_previous": false,
    "next_page": 2,
    "previous_page": null,
    "next_cursor": "10",
    "previous_cursor": null
  }
}
```

## Common Issues and Solutions

### Issue: Page number out of range

The paginator automatically handles invalid page numbers:
- Page < 1 defaults to page 1
- Page > total_pages returns empty data with proper metadata

### Issue: Large datasets slow performance

Use cursor-based pagination for better performance:

```python
paginator = Paginator(CursorPagination(cursor_field='id'))
```

### Issue: Custom object pagination

The paginator works with any iterable. For custom objects, ensure they have the attributes you want to sort by:

```python
class MyItem:
    def __init__(self, id, name):
        self.id = id
        self.name = name

items = [MyItem(i, f"Item {i}") for i in range(100)]
result = paginator.paginate_dict(items, page=1, sort_by='id')
```

## Testing

Run the module directly to see examples:

```bash
python pagination_fix.py
```

## Integration Checklist

- [ ] Import the Paginator class
- [ ] Create paginator instance
- [ ] Get page parameters from request
- [ ] Call paginate_dict with your data
- [ ] Return the result as JSON
- [ ] Update your API documentation
- [ ] Test with different page sizes
- [ ] Handle edge cases (empty data, invalid pages)

## Performance Tips

1. **For large datasets**: Use cursor pagination
2. **For database queries**: Paginate at the database level
3. **Cache results**: Store paginated results for frequently accessed pages
4. **Limit page size**: Set maximum page_size to prevent abuse

## Support

This pagination module is designed to be drop-in ready. Simply import and use it in your existing application. The module handles all edge cases and provides a consistent API for pagination across different frameworks.
